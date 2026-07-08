(function () {
  "use strict";

  function parseCsv(text) {
    var rows = [];
    var current = [];
    var value = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i += 1) {
      var char = text[i];
      var next = text[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        current.push(value);
        value = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          i += 1;
        }
        current.push(value);
        if (
          current.some(function (cell) {
            return cell.trim() !== "";
          })
        ) {
          rows.push(current);
        }
        current = [];
        value = "";
      } else {
        value += char;
      }
    }
    current.push(value);
    if (
      current.some(function (cell) {
        return cell.trim() !== "";
      })
    ) {
      rows.push(current);
    }
    return rows;
  }

  function rowsFromDelimited(rows) {
    if (!rows.length) {
      return [];
    }
    var headers = rows[0].map(function (header) {
      return String(header || "")
        .trim()
        .toLowerCase();
    });
    function indexOfHeader(candidates) {
      for (var i = 0; i < headers.length; i += 1) {
        if (candidates.indexOf(headers[i]) !== -1) {
          return i;
        }
      }
      return -1;
    }
    var idx = {
      observation: indexOfHeader([
        "survey observation no.",
        "survey observation no",
        "observation",
        "obs."
      ]),
      girth: indexOfHeader(["girth (m)", "girth m", "girth"]),
      spread: indexOfHeader(["spread (m)", "spread m", "spread"]),
      height: indexOfHeader(["height (m)", "height m", "height"]),
      species: indexOfHeader(["species"])
    };
    if (idx.girth < 0 || idx.height < 0 || idx.species < 0) {
      return [];
    }
    return rows.slice(1).map(function (row) {
      return {
        observation: idx.observation >= 0 ? row[idx.observation] : "",
        girth: row[idx.girth],
        spread: idx.spread >= 0 ? row[idx.spread] : "",
        height: row[idx.height],
        species: row[idx.species]
      };
    });
  }

  function textFromXmlNode(node) {
    return Array.from(node.getElementsByTagName("t"))
      .map(function (item) {
        return item.textContent || "";
      })
      .join("");
  }

  function parseSharedStrings(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "application/xml");
    return Array.from(doc.getElementsByTagName("si")).map(textFromXmlNode);
  }

  function parseSheetRows(xmlText, sharedStrings) {
    var doc = new DOMParser().parseFromString(xmlText, "application/xml");
    var rows = [];
    Array.from(doc.getElementsByTagName("row")).forEach(function (rowNode) {
      var cells = {};
      Array.from(rowNode.getElementsByTagName("c")).forEach(function (cell) {
        var ref = cell.getAttribute("r") || "";
        var col = ref.replace(/[0-9]/g, "");
        var type = cell.getAttribute("t");
        var valueNode = cell.getElementsByTagName("v")[0];
        var value = "";
        if (type === "inlineStr") {
          value = textFromXmlNode(cell);
        } else if (valueNode) {
          value = valueNode.textContent || "";
          if (type === "s") {
            value = sharedStrings[parseInt(value, 10)] || "";
          }
        }
        cells[col] = value;
      });
      rows.push(cells);
    });
    return rows;
  }

  async function inflateRaw(bytes) {
    if (!("DecompressionStream" in window)) {
      throw new Error(
        "This browser cannot read compressed .xlsx files directly. Save the workbook as CSV and import that file."
      );
    }
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzipEntries(buffer) {
    var bytes = new Uint8Array(buffer);
    var view = new DataView(buffer);
    var decoder = new TextDecoder();
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) {
      throw new Error("Could not read the .xlsx zip directory.");
    }
    var entryCount = view.getUint16(eocd + 10, true);
    var centralOffset = view.getUint32(eocd + 16, true);
    var entries = {};
    var offset = centralOffset;
    for (var entry = 0; entry < entryCount; entry += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) {
        throw new Error("Invalid .xlsx central directory.");
      }
      var method = view.getUint16(offset + 10, true);
      var compressedSize = view.getUint32(offset + 20, true);
      var fileNameLength = view.getUint16(offset + 28, true);
      var extraLength = view.getUint16(offset + 30, true);
      var commentLength = view.getUint16(offset + 32, true);
      var localOffset = view.getUint32(offset + 42, true);
      var name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));
      var localNameLength = view.getUint16(localOffset + 26, true);
      var localExtraLength = view.getUint16(localOffset + 28, true);
      var dataStart = localOffset + 30 + localNameLength + localExtraLength;
      var compressed = bytes.slice(dataStart, dataStart + compressedSize);
      if (method === 0) {
        entries[name] = compressed;
      } else if (method === 8) {
        entries[name] = await inflateRaw(compressed);
      }
      offset += 46 + fileNameLength + extraLength + commentLength;
    }
    return entries;
  }

  async function rowsFromXlsx(file) {
    var buffer = await file.arrayBuffer();
    var entries = await unzipEntries(buffer);
    var decoder = new TextDecoder();
    if (!entries["xl/worksheets/sheet1.xml"]) {
      throw new Error("Could not find xl/worksheets/sheet1.xml in the workbook.");
    }
    var shared = entries["xl/sharedStrings.xml"]
      ? parseSharedStrings(decoder.decode(entries["xl/sharedStrings.xml"]))
      : [];
    return parseSheetRows(decoder.decode(entries["xl/worksheets/sheet1.xml"]), shared)
      .slice(1)
      .map(function (row) {
        return {
          observation: row.B || "",
          girth: row.C || "",
          spread: row.D || "",
          height: row.E || "",
          species: row.F || ""
        };
      });
  }

  function normalizeSurveyRows(sourceRows, defaults) {
    var rows = [];
    var excluded = 0;
    sourceRows.forEach(function (source) {
      var species = window.CarbonData.normalizeSpecies(source.species);
      var girth = parseFloat(source.girth);
      var height = parseFloat(source.height);
      if (!Number.isFinite(girth) || girth <= 0 || !Number.isFinite(height) || height <= 0) {
        return;
      }
      var isExcluded = window.CarbonData.SPECIES[species].excluded;
      if (isExcluded) {
        excluded += 1;
      }
      rows.push({
        observation: source.observation || "",
        species: species,
        girth: girth,
        dbh: window.CarbonCalculations.girthToDbhCm(girth),
        height: height,
        spread: parseFloat(source.spread) || "",
        ageClass: defaults.ageClass,
        condition: isExcluded ? "dead" : defaults.condition,
        location: defaults.location,
        count: 1
      });
    });
    return { rows: rows, excluded: excluded };
  }

  async function parseSurveyFile(file, defaults) {
    if (/\.csv$/i.test(file.name)) {
      return normalizeSurveyRows(rowsFromDelimited(parseCsv(await file.text())), defaults);
    }
    if (/\.xlsx$/i.test(file.name)) {
      return normalizeSurveyRows(await rowsFromXlsx(file), defaults);
    }
    throw new Error("Use an .xlsx workbook or CSV file.");
  }

  window.CarbonImporter = {
    parseSurveyFile: parseSurveyFile
  };
})();
