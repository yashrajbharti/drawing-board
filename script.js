const canvas = document.querySelector("canvas"),
  toolBtns = document.querySelectorAll(".tool"),
  fillColor = document.querySelector("#fill-color"),
  sizeSlider = document.querySelector("#size-slider"),
  colorBtns = document.querySelectorAll(".colors .option"),
  colorPicker = document.querySelector("#color-picker"),
  clearCanvas = document.querySelector(".clear-canvas"),
  saveImg = document.querySelector(".save-img"),
  ctx = canvas.getContext("2d");

// Global variables with default value
let prevMouseX,
  prevMouseY,
  snapshot,
  isDrawing = false,
  selectedTool = "brush",
  brushWidth = 5,
  selectedColor = "#000";
const canvasHistory = [];
let historyStep = -1;

const setCanvasBackground = () => {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selectedColor;
};

// Update the saveToHistory function to ensure it captures states correctly
const saveToHistory = () => {
  // Don't save the same state multiple times
  const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (
    !canvasHistory.length ||
    !canvasHistory[historyStep].data.every(
      (val, i) => val === currentState.data[i]
    )
  ) {
    if (historyStep < canvasHistory.length - 1) {
      canvasHistory.length = historyStep + 1; // Remove future steps if we're in the middle of history
    }

    canvasHistory.push(currentState);
    historyStep++;

    if (canvasHistory.length > 20) canvasHistory.shift(); // Limit to 20 steps
  }
};

const resizeCanvas = () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  setCanvasBackground();
};

window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

let shapeStartX, shapeStartY; // New variables to track the starting position for shapes

const startDraw = (e) => {
  isDrawing = true;
  prevMouseX = e.offsetX;
  prevMouseY = e.offsetY;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle = selectedColor;

  // Store the starting point for shapes
  shapeStartX = e.offsetX;
  shapeStartY = e.offsetY;

  // Save the state of the canvas when starting to draw
  saveToHistory(); // Save initial state before any drawing starts
};

const drawing = (e) => {
  if (!isDrawing) return;

  // Clear the canvas to redraw the shape
  ctx.putImageData(canvasHistory[historyStep], 0, 0); // Restore the last state

  // Draw based on selected tool
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
  ctx.fillStyle = selectedColor;

  if (selectedTool === "brush" || selectedTool === "eraser") {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  } else if (selectedTool === "rectangle") {
    // Draw rectangle while dragging
    drawRect(e);
  } else if (selectedTool === "circle") {
    // Draw circle while dragging
    drawCircle(e);
  } else if (selectedTool === "triangle") {
    // Draw triangle while dragging
    drawTriangle(e);
  } else if (selectedTool === "line") {
    // Draw line while dragging
    drawLine(e);
  }
};

const endDraw = () => {
  if (isDrawing) {
    ctx.closePath();
    saveToHistory(); // Save the state after drawing
  }
  isDrawing = false;

  // Finalize the shape drawing
  if (selectedTool === "rectangle") {
    drawRect({ offsetX: prevMouseX, offsetY: prevMouseY }); // Draw the final rectangle
  } else if (selectedTool === "circle") {
    drawCircle({ offsetX: prevMouseX, offsetY: prevMouseY }); // Draw the final circle
  } else if (selectedTool === "triangle") {
    drawTriangle({ offsetX: prevMouseX, offsetY: prevMouseY }); // Draw the final triangle
  } else if (selectedTool === "line") {
    drawLine({ offsetX: prevMouseX, offsetY: prevMouseY }); // Draw the final line
  }
};

// Update shape drawing functions to use stored start coordinates
const drawRect = (e) => {
  ctx.beginPath();
  if (!fillColor.checked) {
    ctx.strokeRect(
      shapeStartX,
      shapeStartY,
      e.offsetX - shapeStartX,
      e.offsetY - shapeStartY
    );
  } else {
    ctx.fillRect(
      shapeStartX,
      shapeStartY,
      e.offsetX - shapeStartX,
      e.offsetY - shapeStartY
    );
  }
};

const drawCircle = (e) => {
  ctx.beginPath();
  let radius = Math.sqrt(
    Math.pow(shapeStartX - e.offsetX, 2) + Math.pow(shapeStartY - e.offsetY, 2)
  );
  ctx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI);
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawTriangle = (e) => {
  ctx.beginPath();
  ctx.moveTo(shapeStartX, shapeStartY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.lineTo(shapeStartX * 2 - e.offsetX, e.offsetY);
  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawLine = (e) => {
  ctx.beginPath();
  ctx.moveTo(shapeStartX, shapeStartY); // Starting point
  ctx.lineTo(e.offsetX, e.offsetY); // Ending point
  ctx.stroke(); // Draw the line
};

const undo = () => {
  if (historyStep > 0) {
    historyStep--;
    ctx.putImageData(canvasHistory[historyStep], 0, 0);
  }
};

const redo = () => {
  if (historyStep < canvasHistory.length - 1) {
    historyStep++;
    ctx.putImageData(canvasHistory[historyStep], 0, 0);
  }
};

// Undo and Redo button event listeners
document.querySelector(".undo").addEventListener("click", undo);
document.querySelector(".redo").addEventListener("click", redo);

// Clear canvas event listener
clearCanvas.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground();
  saveToHistory();
});

toolBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all tools and add to selected
    toolBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTool = btn.id;

    // Update brush width and color when switching tools
    brushWidth = sizeSlider.value;
  });
});

colorBtns.forEach((color) => {
  color.addEventListener("click", () => {
    colorBtns.forEach((c) => c.classList.remove("selected"));
    color.classList.add("selected");
    selectedColor = window.getComputedStyle(color).backgroundColor;
  });
});

colorPicker.addEventListener("input", (e) => {
  selectedColor = e.target.value;
  colorBtns.forEach((color) => (color.style.backgroundColor = selectedColor));
});

sizeSlider.addEventListener("input", (e) => {
  brushWidth = e.target.value;
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseout", endDraw);

// Save as image functionality
saveImg.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = canvas.toDataURL();
  link.click();
});
