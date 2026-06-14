const gradesTable = document.getElementById("gradesTable");
const addRowBtn = document.getElementById("addRowBtn");
const addColBtn = document.getElementById("addColBtn");
const saveBtn = document.getElementById("saveBtn");
const restoreBtn = document.getElementById("restoreBtn");
const tbody = document.querySelector("tbody");
const unsubmittedCountDisplay = document.getElementById("unsubmittedBox");
let avgMode = "percent";
const store_key = "a03_grades_table_v1";
let lastDeleted = null;

const gradeScale = [
  { min: 93, max: 100, letter: "A", gpa: 4.0 },
  { min: 90, max: 92, letter: "A-", gpa: 3.7 },
  { min: 87, max: 89, letter: "B+", gpa: 3.3 },
  { min: 83, max: 86, letter: "B", gpa: 3.0 },
  { min: 80, max: 82, letter: "B-", gpa: 2.7 },
  { min: 77, max: 79, letter: "C+", gpa: 2.3 },
  { min: 73, max: 76, letter: "C", gpa: 2.0 },
  { min: 70, max: 72, letter: "C-", gpa: 1.7 },
  { min: 67, max: 69, letter: "D+", gpa: 1.3 },
  { min: 63, max: 66, letter: "D", gpa: 1.0 },
  { min: 60, max: 62, letter: "D-", gpa: 0.7 },
  { min: 0, max: 59, letter: "F", gpa: 0.0 },
];

function getColumnIndexes() {
  const total = gradesTable.tHead.rows[0].cells.length;
  const avgCol = total - 1;
  const gradeCols = [];

  for (let i = 2; i < avgCol; i++) {
    gradeCols.push(i);
  }

  return { gradeCols, avgCol };
}

function gradeCellStyleCheck(gradeCol) {
  if (
    gradeCol.textContent.trim() === "-" ||
    gradeCol.textContent.trim() === ""
  ) {
    gradeCol.textContent = "-";
    gradeCol.classList.remove("number");
    gradeCol.classList.add("center-dash");
  } else {
    gradeCol.classList.remove("center-dash");
    gradeCol.classList.add("number");
  }
}

function parseGradeCellText(cellText) {
  const text = cellText.trim();
  if (text === "-" || text === "") {
    return { value: "-", unsubmitted: true };
  }
  let number = Number(text);

  if (number <= 100 && number >= 0) {
    number = Math.round(number);
  } else {
    return { value: "-", unsubmitted: true };
  }
  return { value: number, unsubmitted: false };
}

function recalcAll() {
  const { gradeCols, avgCol } = getColumnIndexes();
  for (const row of tbody.rows) {
    let number = 0;
    let sum = 0;

    for (const c of gradeCols) {
      const td = row.cells[c];
      const text = td.textContent.trim();
      const { value, unsubmitted } = parseGradeCellText(text);

      if (unsubmitted === true) {
        number = 0;
      } else {
        number = value;
      }
      gradeCellStyleCheck(td);
      sum += number;
    }

    let average = Math.round(sum / gradeCols.length);
    const avgCell = row.cells[avgCol];

    if (avgMode === "percent") {
      avgCell.textContent = `${average}%`;
    } else if (avgMode === "letter") {
      avgCell.textContent = `${toLetterAndGPA(average).letter}`;
    } else {
      avgCell.textContent = `${toLetterAndGPA(average).GPA}`;
    }

    avgCell.classList.remove("fail");

    if (average < 60) {
      avgCell.classList.add("fail");
    }
  }
  unsubmittedCounter();
}

function toLetterAndGPA(percent) {
  for (const grade of gradeScale) {
    if (percent <= grade.max && percent >= grade.min) {
      console.log(grade.gpa);
      return { letter: grade.letter, GPA: grade.gpa.toFixed(1) };
    }
  }
}

function init() {
  const gradeCols = getColumnIndexes().gradeCols;
  for (const row of tbody.rows) {
    for (const cell of row.cells) {
      if (gradeCols.includes(cell.cellIndex)) {
        cell.contentEditable = "true";
      }
    }
  }
  recalcAll();
  rewireAverageHeader();
}

init();

function unsubmittedCounter() {
  const { gradeCols } = getColumnIndexes();
  let count = 0;
  for (const row of tbody.rows) {
    for (const cell of row.cells) {
      if (
        gradeCols.includes(cell.cellIndex) &&
        cell.textContent.trim() === "-"
      ) {
        count++;
      }
    }
  }
  unsubmittedCountDisplay.textContent = `Unsubmitted Assignments: ${count}`;
}

function changeAverageHeading() {
  const newAvgHeader = document.getElementById("averageHeader");
  if (avgMode === "percent") {
    newAvgHeader.textContent = "Average [%]";
  } else if (avgMode === "letter") {
    newAvgHeader.textContent = "Average [Letter]";
  } else {
    newAvgHeader.textContent = "Average [4.0]";
  }
}

function rewireAverageHeader() {
  const newAvgHeader = document.getElementById("averageHeader");
  if (!newAvgHeader) return;

  newAvgHeader.onclick = null; //reset any old listeners
  newAvgHeader.addEventListener("click", () => {
    if (avgMode === "percent") {
      avgMode = "letter";
    } else if (avgMode === "letter") {
      avgMode = "gpa";
    } else if (avgMode === "gpa") {
      avgMode = "percent";
    }
    changeAverageHeading();

    recalcAll();
  });
}

tbody.addEventListener(
  "blur",
  (event) => {
    const { gradeCols } = getColumnIndexes();
    //no need but just in case
    const td = event.target.closest("td");
    if (!td) return;

    if (td.contentEditable && gradeCols.includes(td.cellIndex)) {
      const innerText = td.textContent.trim();
      let parseObject = parseGradeCellText(innerText);
      if (parseObject.unsubmitted === true) {
        td.textContent = "-";
      } else {
        td.textContent = String(parseObject.value);
      }
      recalcAll();
    }
  },
  { capture: true }
);

addRowBtn.addEventListener("click", () => {
  const { gradeCols } = getColumnIndexes();
  const tr = document.createElement("tr");

  const nameTd = document.createElement("td");
  nameTd.classList.add("td-left");
  nameTd.textContent = "New Student";
  tr.appendChild(nameTd);

  const idTd = document.createElement("td");
  idTd.classList.add("td-left");
  idTd.textContent = "123456001";
  tr.appendChild(idTd);

  for (let i = 0; i < gradeCols.length; i++) {
    const gradeTd = document.createElement("td");
    gradeTd.textContent = "-";
    gradeTd.contentEditable = "true";
    gradeCellStyleCheck(gradeTd);
    tr.appendChild(gradeTd);
  }

  const avgTd = document.createElement("td");
  tr.appendChild(avgTd);

  tbody.appendChild(tr);
  recalcAll();
});

addColBtn.addEventListener("click", () => {
  const title = prompt(
    "Add name of new column.",
    `Assignment ${getColumnIndexes().gradeCols.length + 1}`
  );
  if (title === null || title.trim() === "") return;
  const th = document.createElement("th");
  th.classList.add("th-center");
  th.textContent = title.trim();

  const headerRow = gradesTable.tHead.rows[0];
  const averageHeader = document.getElementById("averageHeader");
  headerRow.insertBefore(th, averageHeader);

  for (let row of tbody.rows) {
    const td = document.createElement("td");
    td.textContent = "-";
    td.contentEditable = "true";
    gradeCellStyleCheck(td);
    row.insertBefore(td, row.cells[row.cells.length - 1]);
  }
  recalcAll();
});

saveBtn.addEventListener("click", () => {
  try {
    const headEls = gradesTable.tHead.rows[0].cells;
    let headers = new Array();
    for (let i = 0; i < headEls.length; i++) {
      headers[i] = headEls[i].textContent;
    }

    let rows = new Array();
    let row = new Array();
    for (const line of tbody.rows) {
      row = [];
      for (const td of line.cells) {
        row.push(td.textContent.trim());
      }
      rows.push(row);
    }

    const tableData = { headers: headers, rows: rows, avgMode: avgMode };

    const stringTableData = JSON.stringify(tableData);
    localStorage.setItem(store_key, stringTableData);
    alert("Table saved.");
  } catch {
    alert("Could not save table.");
  }
});

restoreBtn.addEventListener("click", () => {
  const rawtableData = localStorage.getItem(store_key);
  if (rawtableData === null) {
    alert("No saved table found.");
    return;
  }

  let tableData;
  try {
    tableData = JSON.parse(rawtableData);
  } catch (e) {
    console.log(e);
    alert("Saved data is corrupted.");
    return;
  }

  const headerRow = gradesTable.tHead.rows[0];
  while (headerRow.firstChild) {
    headerRow.removeChild(headerRow.firstChild);
  }

  for (let i = 0; i < tableData.headers.length; i++) {
    const th = document.createElement("th");
    th.textContent = tableData.headers[i];
    if (i < 2) {
      th.classList.add("th-left");
    } else {
      th.classList.add("th-center");
    }

    if (i === tableData.headers.length - 1) {
      th.setAttribute("id", "averageHeader");
    }

    headerRow.append(th);
  }

  rewireAverageHeader();

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  for (let i = 0; i < tableData.rows.length; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < tableData.rows[i].length; j++) {
      const td = document.createElement("td");
      td.textContent = tableData.rows[i][j];

      if (j >= 2 && j < tableData.rows[i].length - 1) {
        td.contentEditable = "true";
      }

      if (j < 2) {
        td.classList.add("td-left");
      }
      tr.append(td);
    }
    tbody.append(tr);
  }
  avgMode = tableData.avgMode || "percent";
  recalcAll();
});

// HOVERING COLUMN STUFF -------------------------------------------------------------------
gradesTable.addEventListener("mouseover", (event) => {
  const cell = event.target.closest("td") || event.target.closest("th");
  if (!cell) return;
  const columnNumber = cell.cellIndex;

  const { avgCol } = getColumnIndexes();

  for (let row of tbody.rows) {
    if (columnNumber === avgCol) {
      return;
    }

    row.cells[columnNumber].classList.add("highlight-column");
  }
});

gradesTable.addEventListener("mouseout", (event) => {
  const cell = event.target.closest("td") || event.target.closest("th");
  if (!cell) return;
  const columnNumber = cell.cellIndex;

  for (let row of tbody.rows) {
    row.cells[columnNumber].classList.remove("highlight-column");
  }
});

// CUSTOM MENU STUFF --------------------------------------------------------
(() => {
  const menu = document.getElementById("ctxMenu");
  let contextTarget = null; // the th/td that was right-clicked

  // show/hide menu
  function openMenuAt(x, y) {
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    // enable/disable Undelete based on memory
    const undeleteItem = menu.querySelector('[data-action="undelete"]');
    undeleteItem.classList.toggle("disabled", !lastDeleted);
    menu.hidden = false;
  }
  function closeMenu() {
    menu.hidden = true;
    contextTarget = null;
  }

  // helpers
  function isHeaderCell(el) {
    return el && el.tagName === "TH";
  }
  function isBodyCell(el) {
    return el && el.tagName === "TD" && el.closest("tbody");
  }
  function getHeaderIndex(th) {
    if (!th) return -1;
    const cells = Array.from(th.parentElement.children);
    return cells.indexOf(th);
  }
  function getRowIndex(tr) {
    return tr ? tr.sectionRowIndex : -1;
  }

  // actions
  function actionInsertRow(where) {
    if (!isBodyCell(contextTarget)) return;
    const tr = contextTarget.closest("tr");
    const idx = getRowIndex(tr);

    const { gradeCols } = getColumnIndexes();
    const newTr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.className = "td-left";
    tdName.textContent = "New Student";
    newTr.appendChild(tdName);

    const tdID = document.createElement("td");
    tdID.className = "td-left";
    tdID.textContent = "123456001";
    newTr.appendChild(tdID);

    for (let i = 0; i < gradeCols.length; i++) {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = "-";
      newTr.appendChild(td);
    }

    const tdAvg = document.createElement("td");
    tdAvg.className = "avg";
    newTr.appendChild(tdAvg);

    const insertIndex = where === "above" ? idx : idx + 1;
    const ref = tbody.rows[insertIndex] || null;
    tbody.insertBefore(newTr, ref);
    recalcAll();
  }

  function actionInsertColBefore() {
    const { gradeCols } = getColumnIndexes();
    if (!isHeaderCell(contextTarget)) return;
    const th = contextTarget;
    const colIndex = getHeaderIndex(th);

    const title = prompt(
      "Title for the new assignment column:",
      `Assignment ${gradeCols.length + 1}`
    );
    if (title === null || title.trim() === "") return;

    // header
    const newTh = document.createElement("th");
    newTh.className = "th-center";
    newTh.textContent = title.trim();
    gradesTable.tHead.rows[0].insertBefore(
      newTh,
      gradesTable.tHead.rows[0].cells[colIndex]
    );

    // body cells
    for (const tr of tbody.rows) {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = "-";
      tr.insertBefore(td, tr.cells[colIndex]);
    }

    rewireAverageHeader();
    recalcAll();
  }

  function actionDeleteRow() {
    if (!isBodyCell(contextTarget)) return;
    const tr = contextTarget.closest("tr");
    const idx = getRowIndex(tr);

    // remember last delete
    lastDeleted = { type: "row", index: idx, html: tr.outerHTML };

    tbody.removeChild(tr);
    recalcAll();
  }

  function actionDeleteCol() {
    if (!isHeaderCell(contextTarget)) return;
    const th = contextTarget;
    const { avgCol, gradeCols } = getColumnIndexes();
    const colIndex = getHeaderIndex(th);

    // guards
    if (colIndex === 0 || colIndex === 1) {
      alert("Name and Student ID columns cannot be deleted.");
      return;
    }
    if (colIndex === avgCol) {
      alert("Average column cannot be deleted.");
      return;
    }
    if (gradeCols.length <= 1) {
      alert("You must keep at least one assignment column.");
      return;
    }

    // remember last delete (header + each row cell)
    const headerText = th.textContent.trim();
    const cells = [];
    for (const tr of tbody.rows) {
      const td = tr.cells[colIndex];
      cells.push(td ? td.textContent : "");
    }
    lastDeleted = { type: "col", index: colIndex, headerText, cells };

    // remove header and column cells
    th.parentElement.removeChild(th);
    for (const tr of tbody.rows) {
      const td = tr.cells[colIndex];
      if (td) tr.removeChild(td);
    }

    rewireAverageHeader();
    recalcAll();
  }

  function actionUndelete() {
    if (!lastDeleted) return;

    if (lastDeleted.type === "row") {
      const { index, html } = lastDeleted;
      const tmp = document.createElement("tbody");
      tmp.innerHTML = html;
      const restored = tmp.firstElementChild;

      const ref = tbody.rows[index] || null;
      tbody.insertBefore(restored, ref);

      // make grade cells editable again
      for (let i = 2; i < restored.cells.length - 1; i++) {
        restored.cells[i].contentEditable = "true";
      }

      recalcAll();
      lastDeleted = null;
      return;
    }

    if (lastDeleted.type === "col") {
      const { index, headerText, cells } = lastDeleted;
      const headRow = gradesTable.tHead.rows[0];
      const { avgCol } = getColumnIndexes();

      // insert header back at saved index (never after Average)
      const insertIdx = Math.min(index, headRow.cells.length);
      const beforeNode =
        insertIdx >= headRow.cells.length
          ? headRow.cells[avgCol] || null
          : headRow.cells[insertIdx];

      const th = document.createElement("th");
      th.className = "th-center";
      th.textContent = headerText;

      if (!beforeNode || getHeaderIndex(beforeNode) === -1) {
        const { avgCol: avgAgain } = getColumnIndexes();
        headRow.insertBefore(th, headRow.cells[avgAgain]);
      } else {
        headRow.insertBefore(th, beforeNode);
      }

      // insert each body cell
      for (let r = 0; r < tbody.rows.length; r++) {
        const tr = tbody.rows[r];
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = cells[r] ?? "-";
        const ref =
          tr.cells[index] || tr.cells[getColumnIndexes().avgCol] || null;
        tr.insertBefore(td, ref);
      }

      rewireAverageHeader();
      recalcAll();
      lastDeleted = null;
    }
  }

  // open menu on right-click
  gradesTable.addEventListener("contextmenu", (e) => {
    const target = e.target.closest("th,td");
    if (!target) return;

    e.preventDefault();
    contextTarget = target;

    // toggle which items show
    menu
      .querySelectorAll(".row-only")
      .forEach((li) => (li.style.display = "none"));
    menu
      .querySelectorAll(".th-only")
      .forEach((li) => (li.style.display = "none"));

    if (isBodyCell(target)) {
      menu
        .querySelectorAll(".row-only")
        .forEach((li) => (li.style.display = "block"));
    } else if (isHeaderCell(target)) {
      menu
        .querySelectorAll(".th-only")
        .forEach((li) => (li.style.display = "block"));
    }

    openMenuAt(e.pageX, e.pageY);
  });

  // handle clicks on menu items
  menu.addEventListener("click", (e) => {
    const item = e.target.closest(".ctx-item");
    if (!item || item.classList.contains("disabled")) return;

    const action = item.getAttribute("data-action");

    switch (action) {
      case "insert-row-above":
        actionInsertRow("above");
        break;
      case "insert-row-below":
        actionInsertRow("below");
        break;
      case "insert-col-before":
        actionInsertColBefore();
        break;
      case "delete-row":
        actionDeleteRow();
        break;
      case "delete-col":
        actionDeleteCol();
        break;
      case "undelete":
        actionUndelete();
        break;
    }

    closeMenu();
  });

  // dismiss menu
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("scroll", closeMenu, { passive: true });
})();
