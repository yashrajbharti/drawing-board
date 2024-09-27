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
    !canvasHistory[historyStep]?.data?.every(
      (val, i) => val === currentState?.data[i]
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
  // Use e.offsetX and e.offsetY for mouse, or use touches for touch
  prevMouseX =
    e.offsetX !== undefined
      ? e.offsetX
      : e.clientX - canvas.getBoundingClientRect().left;
  prevMouseY =
    e.offsetY !== undefined
      ? e.offsetY
      : e.clientY - canvas.getBoundingClientRect().top;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle = selectedColor;

  // Store the starting point for shapes
  shapeStartX = prevMouseX;
  shapeStartY = prevMouseY;

  // Save the state of the canvas when starting to draw
  saveToHistory(); // Save initial state before any drawing starts
};

const drawing = (e) => {
  if (!isDrawing) return;

  // Clear the canvas to redraw the shape
  if (canvasHistory[historyStep] instanceof ImageData)
    ctx.putImageData(canvasHistory[historyStep], 0, 0); // Restore the last state

  // Draw based on selected tool
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
  ctx.fillStyle = selectedColor;

  const currentX =
    e.offsetX !== undefined
      ? e.offsetX
      : e.clientX - canvas.getBoundingClientRect().left;
  const currentY =
    e.offsetY !== undefined
      ? e.offsetY
      : e.clientY - canvas.getBoundingClientRect().top;

  if (selectedTool === "brush" || selectedTool === "eraser") {
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  } else if (selectedTool === "rectangle") {
    drawRect({ offsetX: currentX, offsetY: currentY });
  } else if (selectedTool === "circle") {
    drawCircle({ offsetX: currentX, offsetY: currentY });
  } else if (selectedTool === "triangle") {
    drawTriangle({ offsetX: currentX, offsetY: currentY });
  } else if (selectedTool === "line") {
    drawLine({ offsetX: currentX, offsetY: currentY });
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
    if (canvasHistory[historyStep] instanceof ImageData)
      ctx.putImageData(canvasHistory[historyStep], 0, 0);
  }
};

const redo = () => {
  if (historyStep < canvasHistory.length - 1) {
    historyStep++;
    if (canvasHistory[historyStep] instanceof ImageData)
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

colorBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // adding click event to all color button
    // removing selected class from the previous option and adding on current clicked option
    document.querySelector(".options .selected").classList.remove("selected");
    btn.classList.add("selected");
    // passing selected btn background color as selectedColor value
    selectedColor = window
      .getComputedStyle(btn)
      .getPropertyValue("background-color");
  });
});

colorPicker.addEventListener("change", () => {
  // passing picked color value from color picker to last color btn background
  colorPicker.parentElement.style.background = colorPicker.value;
  colorPicker.parentElement.click();
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

// Add touch event listeners for mobile
canvas.addEventListener("touchstart", (e) => {
  // Prevent default behavior to avoid scrolling
  e.preventDefault();
  startDraw(e.touches[0]); // Use the first touch point
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault(); // Prevent scrolling
  drawing(e.touches[0]); // Use the first touch point
});

canvas.addEventListener("touchend", endDraw);

const toggleButton = document.querySelector(".toggle-tools");
const toolsContent = document.querySelector(".tools-content");

toggleButton.addEventListener("click", () => {
  const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
  toggleButton.setAttribute("aria-expanded", !isExpanded);
});
