const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const launchSites = require("./launchSites.js");
const startYear = 1957;
const currentYear = new Date().getFullYear();
const dirPath = "launches";

async function fetchAndParseTable(year) {
  try {
    const { data } = await axios.get(
      "https://space.skyrocket.de/doc_chr/lau" + year + ".htm"
    );

    const $ = cheerio.load(data);

    const table = $("table#chronlist");

    const tableData = [];

    table.find("tr").each((rowIndex, row) => {
      const rowData = [];

      $(row)
        .find("td")
        .each((colIndex, col) => {
          rowData.push($(col).text().trim());
          if (colIndex === 5) {
            if ($(row).hasClass("failed")) {
              rowData.push("failed");
            } else if ($(row).hasClass("failedp")) {
              rowData.push("failedp");
            } else {
              rowData.push("success");
            }
          }
          if (colIndex === 4) {
            const site = $(col).text().trim().split(" ");
            rowData.push(
              !!launchSites[site[0]] ? launchSites[site[0]].title : "Unknown"
            );
            rowData.push(
              !!launchSites[site[0]] ? launchSites[site[0]].code : "Unknown"
            );
          }
        });

      if (
        rowData.length > 0 &&
        rowData[0] !== "-" &&
        rowData[0] !== "" &&
        rowData[0] !== "Planned:"
      ) {
        const dd = {
          id: rowData[0],
          date: rowData[1],
          vehicle: rowData[3],
          siteCode: rowData[4],
          site: rowData[5],
          countryCode: rowData[6],
          remark: rowData[7],
          status: rowData[8],
        };
        tableData.push(dd);
      }
    });

    // Log
    // tableData.forEach((row, index) => {
    //   console.log(`Str ${index + 1}:`, row);
    // });

    const filePath = `${dirPath}/${year}.json`;

    fs.writeFile(
      filePath,
      JSON.stringify(tableData, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log(
            `The result was successfully written to the file. ${filePath}`
          );
        }
      }
    );
  } catch (error) {
    console.error("Parsing error:", error);
  }
}

for (let year = startYear; year <= currentYear; year++) {
  if (!fs.existsSync(`${dirPath}/${year}.json`)) {
    fetchAndParseTable(year);
  }
  if (year === currentYear) {
    fetchAndParseTable(year);
  }
}
