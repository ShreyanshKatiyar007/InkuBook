// Global variables
let currentPageNumber = 1;
let totalPages = 1;
let isTrackingChanges = false;
let autoSaveInterval;
let currentDocumentId = null;
let isNewDocument = true;
let hasUnsavedChanges = false;

// Document management functions
function createNewDocument() {
  // Check for unsaved changes
  if (hasUnsavedChanges && !confirm("You have unsaved changes. Are you sure you want to create a new document?")) {
    return;
  }

  // Clear current document
  const documentContainer = document.querySelector(".document");
  documentContainer.innerHTML = `
    <div class="page" contenteditable="true" id="page1">
      <p>Start typing your eBook content here...</p>
    </div>
  `;

  // Reset document state
  document.getElementById("documentTitle").value = "Untitled Document";
  currentDocumentId = null;
  isNewDocument = true;
  hasUnsavedChanges = false;
  totalPages = 1;

  // Update stats and UI
  updateDocumentStats();
  showToast("New document created");
}

function openDocument() {
  populateSavedDocuments();
  document.getElementById("openDocModal").style.display = "block";
}

function saveDocument() {
  try {
    const title = document.getElementById("documentTitle").value.trim() || "Untitled Document";
    const pages = document.querySelectorAll(".page");
    const content = Array.from(pages).map((page) => page.innerHTML);

    // Generate document ID if new document
    if (!currentDocumentId) {
      currentDocumentId = "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      isNewDocument = false;
    }

    const documentData = {
      id: currentDocumentId,
      title: title,
      content: content,
      lastModified: new Date().toISOString(),
      wordCount: getWordCount(),
      pageCount: totalPages,
      created: isNewDocument ? new Date().toISOString() : (getSavedDocument(currentDocumentId)?.created || new Date().toISOString())
    };

    // Save to localStorage
    const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
    const existingIndex = savedDocs.findIndex(doc => doc.id === currentDocumentId);

    if (existingIndex >= 0) {
      savedDocs[existingIndex] = documentData;
    } else {
      savedDocs.unshift(documentData);
    }

    // Keep only last 20 documents
    if (savedDocs.length > 20) {
      savedDocs.splice(20);
    }

    localStorage.setItem("inkubook_saved_documents", JSON.stringify(savedDocs));

    // Update UI
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("lastSaved").textContent = timeString;

    hasUnsavedChanges = false;
    updateRecentDocuments();
    showToast("Document saved successfully!");
    
    return true;
  } catch (error) {
    console.error("Error saving document:", error);
    showToast("Error saving document", "error");
    return false;
  }
}

function getSavedDocument(documentId) {
  const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
  return savedDocs.find(doc => doc.id === documentId);
}

function loadDocument(documentId) {
  try {
    const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
    const document = savedDocs.find((doc) => doc.id === documentId);

    if (!document) {
      showToast("Document not found", "error");
      return;
    }

    // Check for unsaved changes
    if (hasUnsavedChanges && !confirm("You have unsaved changes. Are you sure you want to open another document?")) {
      return;
    }

    // Load document content
    const documentContainer = document.querySelector(".document");
    documentContainer.innerHTML = "";

    document.content.forEach((pageContent, index) => {
      const page = document.createElement("div");
      page.className = "page";
      page.contentEditable = true;
      page.id = `page${index + 1}`;
      page.innerHTML = pageContent;
      documentContainer.appendChild(page);
    });

    // Update document state
    document.getElementById("documentTitle").value = document.title;
    currentDocumentId = documentId;
    isNewDocument = false;
    hasUnsavedChanges = false;
    totalPages = document.content.length;

    // Update UI
    updateDocumentStats();
    document.getElementById("openDocModal").style.display = "none";
    showToast(`Opened: ${document.title}`);
  } catch (error) {
    console.error("Error loading document:", error);
    showToast("Error loading document", "error");
  }
}

function deleteDocument(documentId) {
  if (confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
    try {
      const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
      const filteredDocs = savedDocs.filter((doc) => doc.id !== documentId);
      localStorage.setItem("inkubook_saved_documents", JSON.stringify(filteredDocs));

      populateSavedDocuments();
      updateRecentDocuments();
      showToast("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("Error deleting document", "error");
    }
  }
}

function populateSavedDocuments() {
  const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
  const container = document.getElementById("savedDocumentsList");

  if (savedDocs.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--ribbon-group-title);">No saved documents found</p>';
    return;
  }

  container.innerHTML = savedDocs
    .map(
      (doc) => `
    <div class="saved-doc-item" onclick="loadDocument('${doc.id}')">
      <div class="saved-doc-title">${doc.title}</div>
      <div class="saved-doc-meta">
        <span>${doc.wordCount} words, ${doc.pageCount} pages</span>
        <span>${new Date(doc.lastModified).toLocaleDateString()}</span>
      </div>
      <div class="saved-doc-actions">
        <button class="doc-action-btn" onclick="event.stopPropagation(); loadDocument('${doc.id}')">Open</button>
        <button class="doc-action-btn delete" onclick="event.stopPropagation(); deleteDocument('${doc.id}')">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

function updateRecentDocuments() {
  const savedDocs = JSON.parse(localStorage.getItem("inkubook_saved_documents") || "[]");
  const container = document.getElementById("recentDocuments");

  if (savedDocs.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--ribbon-group-title); font-size: 0.8rem;">No recent documents</div>';
    return;
  }

  // Show only the 3 most recent documents
  const recentDocs = savedDocs.slice(0, 3);

  container.innerHTML = recentDocs
    .map(
      (doc) => `
    <div class="recent-doc-item" onclick="loadDocument('${doc.id}')">
      <div class="recent-doc-title">${doc.title}</div>
      <div class="recent-doc-date">${new Date(doc.lastModified).toLocaleDateString()}</div>
    </div>
  `
    )
    .join("");
}

function getWordCount() {
  const pages = document.querySelectorAll(".page");
  let totalText = "";
  pages.forEach((page) => {
    totalText += page.innerText + " ";
  });
  return totalText.split(/\s+/).filter((word) => word.length > 0).length;
}

// Enhanced export functionality
function exportDocument() {
  document.getElementById("exportModal").style.display = "block";
}

function performExport() {
  const format = document.getElementById("exportFormat").value;
  const title = document.getElementById("documentTitle").value || "Untitled Document";
  const pages = document.querySelectorAll(".page");
  
  try {
    switch (format) {
      case 'html':
        exportAsHTML(title, pages);
        break;
      case 'pdf':
        exportAsPDF(title);
        break;
      case 'txt':
        exportAsText(title, pages);
        break;
      case 'docx':
        exportAsDocx(title, pages);
        break;
      default:
        exportAsHTML(title, pages);
    }
    
    document.getElementById("exportModal").style.display = "none";
    showToast(`Document exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error("Export error:", error);
    showToast("Error exporting document", "error");
  }
}

function exportAsHTML(title, pages) {
  let content = "";
  pages.forEach((page) => {
    content += page.innerHTML + '<div style="page-break-after: always;"></div>';
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Calibri', sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 794px;
      margin: 0 auto;
      padding: 72px;
      background: white;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    table td, table th {
      border: 1px solid #ddd;
      padding: 8px;
    }
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    p {
      margin-bottom: 1em;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    @media print {
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  downloadFile(htmlContent, `${title}.html`, 'text/html');
}

function exportAsText(title, pages) {
  let content = "";
  pages.forEach((page, index) => {
    content += page.innerText;
    if (index < pages.length - 1) {
      content += "\n\n--- Page Break ---\n\n";
    }
  });

  downloadFile(content, `${title}.txt`, 'text/plain');
}

function exportAsPDF(title) {
  // For PDF export, we'll use the browser's print functionality
  const originalTitle = document.title;
  document.title = title;
  
  showToast("Opening print dialog for PDF export...", "info");
  setTimeout(() => {
    window.print();
    document.title = originalTitle;
  }, 500);
}

function exportAsDocx(title, pages) {
  // Basic DOCX-like export (actually HTML with .docx extension for basic compatibility)
  let content = "";
  pages.forEach((page) => {
    content += page.innerHTML + '<w:br w:type="page"/>';
  });

  const docxContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; }
    table { border-collapse: collapse; width: 100%; }
    table td, table th { border: 1px solid #000; padding: 4pt; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  downloadFile(docxContent, `${title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Enhanced print functionality
function printDocument() {
  try {
    // Save current state
    const originalTitle = document.title;
    const title = document.getElementById("documentTitle").value || "Untitled Document";
    
    // Set document title for printing
    document.title = title;
    
    // Add print-specific styles if needed
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        .page {
          page-break-after: always;
          box-shadow: none !important;
          margin: 0 !important;
        }
        .page:last-child {
          page-break-after: auto;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Show toast and print
    showToast("Opening print dialog...", "info");
    
    setTimeout(() => {
      window.print();
      
      // Cleanup
      document.title = originalTitle;
      const printStylesElement = document.getElementById('print-styles');
      if (printStylesElement) {
        printStylesElement.remove();
      }
    }, 500);
    
  } catch (error) {
    console.error("Print error:", error);
    showToast("Error printing document", "error");
  }
}

// Auto-save functionality
function initAutosave() {
  // Clear any existing interval
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  
  autoSaveInterval = setInterval(() => {
    // Only auto-save if document has been manually saved at least once and has changes
    if (!isNewDocument && currentDocumentId && hasUnsavedChanges) {
      if (saveDocument()) {
        console.log("Auto-saved document");
      }
    }
  }, 30000); // Auto-save every 30 seconds
}

// Track changes in document
function markDocumentAsChanged() {
  if (!hasUnsavedChanges) {
    hasUnsavedChanges = true;
    // Update title to show unsaved changes
    const titleElement = document.getElementById("documentTitle");
    if (!titleElement.value.endsWith("*")) {
      titleElement.style.fontStyle = "italic";
    }
  }
}

// Basic formatting commands
function execCmd(command) {
  document.execCommand(command, false, null);
  markDocumentAsChanged();
  updateDocumentStats();
}

function setBold() {
  execCmd("bold");
}

function setItalic() {
  execCmd("italic");
}

function setUnderline() {
  execCmd("underline");
}

// Font controls
function initFontControls() {
  const fontName = document.getElementById("fontName");
  const fontSize = document.getElementById("fontSize");
  const heading = document.getElementById("heading");
  const penColor = document.getElementById("penColor");
  const highlightColor = document.getElementById("highlightColor");

  if (fontName) {
    fontName.addEventListener("change", function () {
      document.execCommand("fontName", false, this.value);
      markDocumentAsChanged();
      updateDocumentStats();
    });
  }

  if (fontSize) {
    fontSize.addEventListener("change", function () {
      document.execCommand("fontSize", false, this.value);
      markDocumentAsChanged();
      updateDocumentStats();
    });
  }

  if (heading) {
    heading.addEventListener("change", function () {
      const value = this.value;
      document.execCommand("formatBlock", false, value === "p" ? "div" : value);
      markDocumentAsChanged();
      updateDocumentStats();
    });
  }

  if (penColor) {
    penColor.addEventListener("change", function () {
      document.execCommand("foreColor", false, this.value);
      markDocumentAsChanged();
    });
  }

  if (highlightColor) {
    highlightColor.addEventListener("change", function () {
      document.execCommand("hiliteColor", false, this.value);
      markDocumentAsChanged();
    });
  }
}

// List functionality
function applyList() {
  const bulletType = document.getElementById("bulletType");
  if (!bulletType) return;

  const type = bulletType.value;
  const isOrdered = ["decimal", "lower-alpha", "upper-roman"].includes(type);
  const command = isOrdered ? "insertOrderedList" : "insertUnorderedList";

  document.execCommand(command);

  setTimeout(() => {
    const listTag = isOrdered ? "ol" : "ul";
    const lists = document.querySelectorAll(`${listTag}`);
    lists.forEach((list) => {
      list.style.listStyleType = type === "check" ? "none" : type;
      if (type === "check") {
        list.querySelectorAll("li").forEach((li) => {
          if (!li.dataset.checked) {
            li.dataset.checked = true;
            li.innerHTML = `✔ ${li.innerHTML}`;
          }
        });
      }
    });
    markDocumentAsChanged();
    updateDocumentStats();
  }, 100);
}

// Line height functionality
function applyLineHeight() {
  const lineHeightSelect = document.getElementById("lineHeightSelect");
  if (!lineHeightSelect) return;

  const lineHeight = lineHeightSelect.value;
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  let parent = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement;

  while (parent && parent !== document.body && !parent.classList.contains("page")) {
    if (window.getComputedStyle(parent).display === "block") {
      parent.style.lineHeight = lineHeight;
      break;
    }
    parent = parent.parentElement;
  }
  markDocumentAsChanged();
  updateDocumentStats();
}

// Paragraph spacing
function applyParagraphSpacing() {
  const spacingBefore = document.getElementById("spacingBefore").value + "px";
  const spacingAfter = document.getElementById("spacingAfter").value + "px";

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  let parent = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement;

  while (parent && parent !== document.body && !parent.classList.contains("page")) {
    if (window.getComputedStyle(parent).display === "block") {
      parent.style.marginTop = spacingBefore;
      parent.style.marginBottom = spacingAfter;
      break;
    }
    parent = parent.parentElement;
  }
  markDocumentAsChanged();
  updateDocumentStats();
}

// Style application
function applyStyle(styleName) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.className = styleName;

  switch (styleName) {
    case "title":
      span.style.fontSize = "24pt";
      span.style.fontWeight = "bold";
      span.style.color = "#333";
      break;
    case "subtitle":
      span.style.fontSize = "18pt";
      span.style.fontWeight = "normal";
      span.style.fontStyle = "italic";
      span.style.color = "#666";
      break;
    case "quote":
      span.style.fontStyle = "italic";
      span.style.borderLeft = "3px solid #ccc";
      span.style.paddingLeft = "10px";
      span.style.color = "#555";
      break;
    case "emphasis":
      span.style.fontWeight = "bold";
      span.style.color = "#0066cc";
      break;
  }

  if (range.collapsed) {
    span.textContent = styleName;
    range.insertNode(span);
  } else {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
  markDocumentAsChanged();
  updateDocumentStats();
}

// Page break insertion
function insertPageBreak() {
  const pageBreak = document.createElement("div");
  pageBreak.className = "page-break";
  pageBreak.style.pageBreakAfter = "always";
  pageBreak.style.height = "0";
  pageBreak.innerHTML = "<hr style='border: none; border-top: 2px dashed #ccc; margin: 20px 0;'>";

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(pageBreak);
    range.setStartAfter(pageBreak);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Create a new page
  const newPage = document.createElement("div");
  newPage.className = "page";
  newPage.contentEditable = true;
  newPage.id = `page${++totalPages}`;
  newPage.innerHTML = "<p><br></p>";

  const documentContainer = document.querySelector(".document");
  documentContainer.appendChild(newPage);

  updatePageNumbers();
  markDocumentAsChanged();
  updateDocumentStats();
  showToast("New page added");
}

// Cover page insertion
function insertCoverPage() {
  const coverPage = document.createElement("div");
  coverPage.className = "page";
  coverPage.contentEditable = true;
  coverPage.id = "coverPage";
  coverPage.innerHTML = `
    <div style="text-align: center; margin-top: 200px;">
      <h1 style="font-size: 36pt; margin-bottom: 50px;">Book Title</h1>
      <h2 style="font-size: 24pt; margin-bottom: 30px;">Subtitle</h2>
      <h3 style="font-size: 18pt; margin-bottom: 100px;">by Author Name</h3>
      <p style="font-size: 14pt;">Publisher Name</p>
      <p style="font-size: 14pt;">${new Date().getFullYear()}</p>
    </div>
  `;

  const documentContainer = document.querySelector(".document");
  const firstPage = documentContainer.querySelector(".page");
  documentContainer.insertBefore(coverPage, firstPage);

  totalPages++;
  updatePageNumbers();
  markDocumentAsChanged();
  updateDocumentStats();
  showToast("Cover page added");
}

function updatePageNumbers() {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page, index) => {
    let pageNumber = page.querySelector(".page-number");
    if (pageNumber) {
      pageNumber.textContent = `Page ${index + 1}`;
    }
  });

  totalPages = pages.length;
  document.getElementById("totalPages").textContent = totalPages;
}

// Table insertion
function insertTable() {
  const tableModal = document.getElementById("tableModal");
  if (tableModal) {
    tableModal.style.display = "block";
  }
}

// Link insertion
function insertLink() {
  const linkModal = document.getElementById("linkModal");
  if (linkModal) {
    linkModal.style.display = "block";
  }
}

// Image insertion
function insertImage() {
  const imageModal = document.getElementById("imageModal");
  if (imageModal) {
    imageModal.style.display = "block";
  }
}

// Chart insertion
function insertChart() {
  const chartModal = document.getElementById("chartModal");
  if (chartModal) {
    chartModal.style.display = "block";
  }
}

// Shape insertion
function insertShape() {
  const shapeModal = document.getElementById("shapeModal");
  if (shapeModal) {
    shapeModal.style.display = "block";
  }
}

// Bookmark insertion
function insertBookmark() {
  const bookmarkName = prompt("Enter bookmark name:");
  if (bookmarkName) {
    const bookmark = document.createElement("a");
    bookmark.name = bookmarkName;
    bookmark.id = bookmarkName;
    bookmark.innerHTML = `<span style="background: yellow; padding: 2px;">[${bookmarkName}]</span>`;

    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.insertNode(bookmark);
    }
    markDocumentAsChanged();
    showToast("Bookmark added");
  }
}

// Header insertion
function insertHeader() {
  const headerText = prompt("Enter header text:");
  if (headerText) {
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => {
      let header = page.querySelector(".page-header");
      if (!header) {
        header = document.createElement("div");
        header.className = "page-header";
        header.style.cssText = "position: absolute; top: 20px; left: 72px; right: 72px; text-align: center; font-size: 10pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;";
        page.appendChild(header);
      }
      header.textContent = headerText;
    });
    markDocumentAsChanged();
    showToast("Header added to all pages");
  }
}

// Footer insertion
function insertFooter() {
  const footerText = prompt("Enter footer text:");
  if (footerText) {
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => {
      let footer = page.querySelector(".page-footer");
      if (!footer) {
        footer = document.createElement("div");
        footer.className = "page-footer";
        footer.style.cssText = "position: absolute; bottom: 20px; left: 72px; right: 72px; text-align: center; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 5px;";
        page.appendChild(footer);
      }
      footer.textContent = footerText;
    });
    markDocumentAsChanged();
    showToast("Footer added to all pages");
  }
}

// Page number insertion
function insertPageNumber() {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page, index) => {
    let pageNumber = page.querySelector(".page-number");
    if (!pageNumber) {
      pageNumber = document.createElement("div");
      pageNumber.className = "page-number";
      pageNumber.style.cssText = "position: absolute; bottom: 20px; right: 72px; font-size: 10pt;";
      page.appendChild(pageNumber);
    }
    pageNumber.textContent = `Page ${index + 1}`;
  });
  markDocumentAsChanged();
  showToast("Page numbers added");
}

// Footnote insertion
function insertFootnote() {
  const footnoteNumber = document.querySelectorAll(".footnote").length + 1;

  const footnoteRef = document.createElement("sup");
  footnoteRef.className = "footnote-ref";
  footnoteRef.textContent = footnoteNumber;
  footnoteRef.id = "fnref-" + footnoteNumber;

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(footnoteRef);
    range.setStartAfter(footnoteRef);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const page = document.querySelector(".page");
  let footnotesContainer = page.querySelector(".footnotes-container");
  if (!footnotesContainer) {
    footnotesContainer = document.createElement("div");
    footnotesContainer.className = "footnotes-container";
    footnotesContainer.style.cssText = "position: absolute; bottom: 100px; left: 72px; right: 72px;";
    page.appendChild(footnotesContainer);
  }

  const footnote = document.createElement("div");
  footnote.className = "footnote";
  footnote.innerHTML = `<sup>${footnoteNumber}</sup> Enter footnote text here...`;
  footnotesContainer.appendChild(footnote);

  markDocumentAsChanged();
  updateDocumentStats();
  showToast("Footnote added");
}

// Comment insertion
function insertComment() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const marker = document.createElement("span");
  marker.className = "comment-marker";

  if (range.collapsed) {
    marker.textContent = "※";
    range.insertNode(marker);
  } else {
    const contents = range.extractContents();
    marker.appendChild(contents);
    range.insertNode(marker);
  }

  const comment = document.createElement("div");
  comment.className = "comment";
  comment.contentEditable = true;
  comment.textContent = "Add comment here...";

  const rect = marker.getBoundingClientRect();
  const pageRect = document.querySelector(".page").getBoundingClientRect();

  comment.style.top = rect.top - pageRect.top + "px";
  marker.appendChild(comment);
  comment.focus();

  markDocumentAsChanged();
  updateDocumentStats();
  showToast("Comment added");
}

// Delete comment
function deleteComment() {
  const comments = document.querySelectorAll(".comment");
  if (comments.length > 0) {
    comments.forEach((comment) => comment.remove());
    markDocumentAsChanged();
    showToast("All comments deleted");
  } else {
    showToast("No comments to delete", "warning");
  }
}

// Citation insertion
function insertCitation() {
  const citation = prompt("Enter citation (e.g., Author, Year):");
  if (citation) {
    const citationElement = document.createElement("span");
    citationElement.style.cssText = "font-style: italic; color: #666;";
    citationElement.textContent = `(${citation})`;

    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.insertNode(citationElement);
    }
    markDocumentAsChanged();
    showToast("Citation added");
  }
}

// Bibliography insertion
function insertBibliography() {
  const bibliography = document.createElement("div");
  bibliography.innerHTML = `
    <h2>Bibliography</h2>
    <p>1. Author, A. (Year). Title of work. Publisher.</p>
    <p>2. Author, B. (Year). Title of work. Publisher.</p>
    <p>3. Author, C. (Year). Title of work. Publisher.</p>
  `;

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(bibliography);
  }
  markDocumentAsChanged();
  showToast("Bibliography template added");
}

// Table of contents insertion
function insertTableOfContents() {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const toc = document.createElement("div");
  toc.innerHTML = "<h2>Table of Contents</h2>";

  const tocList = document.createElement("ol");
  headings.forEach((heading, index) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<a href="#heading-${index}" style="text-decoration: none; color: #0066cc;">${heading.textContent}</a>`;
    heading.id = `heading-${index}`;
    tocList.appendChild(listItem);
  });

  toc.appendChild(tocList);

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(toc);
  }
  markDocumentAsChanged();
  showToast("Table of contents generated");
}

// Spell check
function spellCheck() {
  showToast("Spell check would integrate with a spell checking API in production", "info");
}

// Thesaurus
function openThesaurus() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    showToast(`Thesaurus lookup for: "${selectedText}"`, "info");
  } else {
    showToast("Select a word to look up in thesaurus", "warning");
  }
}

// Track changes toggle
function toggleTrackChanges() {
  isTrackingChanges = !isTrackingChanges;
  const button = event.target.closest(".ribbon-button");
  if (isTrackingChanges) {
    button.classList.add("active");
    showToast("Track changes enabled");
  } else {
    button.classList.remove("active");
    showToast("Track changes disabled");
  }
}

// Word count modal
function showWordCount() {
  updateWordCountModal();
  document.getElementById("wordCountModal").style.display = "block";
}

function updateWordCountModal() {
  const text = document.querySelector(".page").innerText;

  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const charCount = text.length;
  const charNoSpaceCount = text.replace(/\s+/g, "").length;
  const paraCount = text.split(/\n\n+/).filter((para) => para.trim().length > 0).length;
  const pageCount = Math.ceil(wordCount / 500);

  document.getElementById("modalWordCount").textContent = wordCount;
  document.getElementById("modalCharCount").textContent = charCount;
  document.getElementById("modalCharNoSpaceCount").textContent = charNoSpaceCount;
  document.getElementById("modalParaCount").textContent = paraCount;
  document.getElementById("modalPageCount").textContent = pageCount;
}

// Page setup functions
function setPageOrientation(orientation) {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll("#layout-panel .ribbon-button");

  buttons.forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".ribbon-button").classList.add("active");

  pages.forEach((page) => {
    if (orientation === "portrait") {
      page.style.width = "794px";
      page.style.minHeight = "1123px";
    } else {
      page.style.width = "1123px";
      page.style.minHeight = "794px";
    }
  });
  markDocumentAsChanged();
  showToast(`Page orientation set to ${orientation}`);
}

function setPageSize() {
  const size = document.getElementById("pageSize").value;
  const pages = document.querySelectorAll(".page");

  pages.forEach((page) => {
    switch (size) {
      case "letter":
        page.style.width = "816px";
        page.style.minHeight = "1056px";
        break;
      case "a4":
        page.style.width = "794px";
        page.style.minHeight = "1123px";
        break;
      case "legal":
        page.style.width = "816px";
        page.style.minHeight = "1344px";
        break;
      case "tabloid":
        page.style.width = "1056px";
        page.style.minHeight = "1632px";
        break;
    }
  });
  markDocumentAsChanged();
  showToast(`Page size set to ${size.toUpperCase()}`);
}

// Margins modal
function showMarginsModal() {
  document.getElementById("marginsModal").style.display = "block";
}

// Text wrapping toggle
function toggleTextWrap() {
  const button = event.target.closest(".ribbon-button");
  button.classList.toggle("active");
  showToast("Text wrapping toggled");
}

// Bring forward/send backward
function bringForward() {
  showToast("Bring forward functionality");
}

function sendBackward() {
  showToast("Send backward functionality");
}

// View mode functions
function setView(mode) {
  const doc = document.getElementById("document");
  const buttons = document.querySelectorAll("#view-panel .ribbon-button");

  buttons.forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".ribbon-button").classList.add("active");

  doc.classList.remove("read-mode", "edit-mode", "print-mode");
  doc.classList.add(mode + "-mode");

  showToast(`View mode: ${mode}`);
}

// Zoom functions
function changeZoom(delta) {
  const zoomSelect = document.getElementById("zoomLevel");
  const currentZoom = parseInt(zoomSelect.value);
  const newZoom = currentZoom + delta;

  const zoomLevels = Array.from(zoomSelect.options).map((opt) => parseInt(opt.value));
  const closestZoom = zoomLevels.reduce((prev, curr) => {
    return Math.abs(curr - newZoom) < Math.abs(prev - newZoom) ? curr : prev;
  });

  zoomSelect.value = closestZoom;
  setZoom();
}

function setZoom() {
  const zoomLevel = document.getElementById("zoomLevel").value;
  const document = document.querySelector(".document");

  document.style.transform = `scale(${zoomLevel / 100})`;
  document.style.transformOrigin = "top center";

  document.getElementById("statusZoom").textContent = zoomLevel + "%";
  showToast(`Zoom: ${zoomLevel}%`);
}

// Template functions
function initTemplateSelector() {
  const showTemplatesBtn = document.getElementById("showTemplatesBtn");
  const showTemplatesSidebarBtn = document.getElementById("showTemplatesSidebarBtn");
  const templateSelector = document.getElementById("templateSelector");
  const closeTemplatesBtn = document.getElementById("closeTemplatesBtn");
  const templateItems = document.querySelectorAll(".template-item");

  if (showTemplatesBtn) {
    showTemplatesBtn.addEventListener("click", () => {
      templateSelector.style.display = "block";
    });
  }

  if (showTemplatesSidebarBtn) {
    showTemplatesSidebarBtn.addEventListener("click", () => {
      templateSelector.style.display = "block";
    });
  }

  if (closeTemplatesBtn) {
    closeTemplatesBtn.addEventListener("click", () => {
      templateSelector.style.display = "none";
    });
  }

  templateItems.forEach((item) => {
    item.addEventListener("click", () => {
      const templateName = item.getAttribute("data-template");
      applyTemplate(templateName);
      templateSelector.style.display = "none";
    });
  });
}

function applyTemplate(templateName) {
  const page = document.querySelector(".page");
  page.innerHTML = "";

  switch (templateName) {
    case "blank":
      page.innerHTML = "<p>Start typing your content here...</p>";
      break;
    case "novel":
      page.innerHTML = `
        <h1 style="text-align: center; margin-bottom: 2rem;">Novel Title</h1>
        <h2 style="text-align: center; margin-bottom: 4rem;">by Author Name</h2>
        <h3 style="margin-top: 2rem;">Chapter 1</h3>
        <p>Begin your story here. The first paragraph is typically not indented.</p>
        <p style="text-indent: 30px;">Subsequent paragraphs are indented. This helps the reader distinguish between paragraphs easily.</p>
        <p style="text-indent: 30px;">Continue your narrative, developing characters and setting the scene.</p>
      `;
      break;
    case "business":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 3rem;">
          <h1>Business Report</h1>
          <h3>Company Name</h3>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <h2>Executive Summary</h2>
        <p>Provide a brief overview of the report's purpose and key findings.</p>
        <h2>Introduction</h2>
        <p>Explain the background and context of the report.</p>
        <h2>Analysis</h2>
        <p>Present your data and analysis here.</p>
        <h2>Recommendations</h2>
        <p>Based on the analysis, provide actionable recommendations.</p>
        <h2>Conclusion</h2>
        <p>Summarize the key points and next steps.</p>
      `;
      break;
    case "academic":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 3rem;">
          <h1>Academic Paper Title</h1>
          <p>Author Name</p>
          <p>Institution</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <h2>Abstract</h2>
        <p>A brief summary of the paper, including the research question, methodology, results, and conclusions.</p>
        <h2>Introduction</h2>
        <p>Provide background information, state the research problem, and outline the purpose of the study.</p>
        <h2>Literature Review</h2>
        <p>Summarize relevant previous research and establish the theoretical framework.</p>
        <h2>Methodology</h2>
        <p>Describe the research design, participants, materials, and procedures.</p>
        <h2>Results</h2>
        <p>Present the findings of the study without interpretation.</p>
        <h2>Discussion</h2>
        <p>Interpret the results, discuss implications, and suggest future research.</p>
        <h2>References</h2>
        <p>List all sources cited in the paper.</p>
      `;
      break;
    case "resume":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>Your Name</h1>
          <p>Email: your.email@example.com | Phone: (123) 456-7890 | Location: City, State</p>
        </div>
        <h2>Professional Summary</h2>
        <p>A brief overview of your skills, experience, and career goals.</p>
        <h2>Work Experience</h2>
        <h3>Job Title, Company Name</h3>
        <p>Month Year - Present</p>
        <ul>
          <li>Key responsibility or achievement</li>
          <li>Key responsibility or achievement</li>
          <li>Key responsibility or achievement</li>
        </ul>
        <h3>Previous Job Title, Company Name</h3>
        <p>Month Year - Month Year</p>
        <ul>
          <li>Key responsibility or achievement</li>
          <li>Key responsibility or achievement</li>
        </ul>
        <h2>Education</h2>
        <h3>Degree, Institution Name</h3>
        <p>Graduation Year</p>
        <h2>Skills</h2>
        <p>Skill 1, Skill 2, Skill 3, Skill 4, Skill 5</p>
      `;
      break;
    case "newsletter":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>Newsletter Title</h1>
          <p>Volume X, Issue Y | Month Year</p>
        </div>
        <h2>Main Article Headline</h2>
        <p>Write your main article here. This should be the most important or interesting news item.</p>
        <p>Continue with additional paragraphs as needed.</p>
        <h2>Secondary Article</h2>
        <p>Information about another important topic.</p>
        <h3>Subheading</h3>
        <p>More details about this topic.</p>
        <h2>Upcoming Events</h2>
        <ul>
          <li><strong>Event Name</strong> - Date, Time, Location</li>
          <li><strong>Event Name</strong> - Date, Time, Location</li>
        </ul>
        <h2>Contact Information</h2>
        <p>Email: contact@example.com | Phone: (123) 456-7890 | Website: www.example.com</p>
      `;
      break;
    case "cookbook":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>Recipe Name</h1>
          <p>Preparation Time: XX minutes | Cooking Time: XX minutes | Serves: X</p>
        </div>
        <h2>Ingredients</h2>
        <ul>
          <li>Ingredient 1 - amount</li>
          <li>Ingredient 2 - amount</li>
          <li>Ingredient 3 - amount</li>
          <li>Ingredient 4 - amount</li>
        </ul>
        <h2>Instructions</h2>
        <ol>
          <li>First step of the recipe.</li>
          <li>Second step of the recipe.</li>
          <li>Third step of the recipe.</li>
          <li>Fourth step of the recipe.</li>
        </ol>
        <h2>Notes</h2>
        <p>Any additional tips or variations for the recipe.</p>
        <h2>Nutritional Information</h2>
        <p>Calories: XXX | Protein: XXg | Carbohydrates: XXg | Fat: XXg</p>
      `;
      break;
    case "poetry":
      page.innerHTML = `
        <div style="text-align: center; margin-bottom: 3rem;">
          <h1>Poem Title</h1>
          <h3>by Poet Name</h3>
        </div>
        <div style="text-align: center; line-height: 2;">
          <p>First line of the poem,</p>
          <p>Second line with careful words,</p>
          <p>Third line expressing feeling,</p>
          <p>Fourth line with imagery.</p>
          <br>
          <p>Second stanza begins here,</p>
          <p>Continuing the theme or shifting,</p>
          <p>Building toward the conclusion,</p>
          <p>Final line with impact.</p>
        </div>
      `;
      break;
  }

  markDocumentAsChanged();
  updateDocumentStats();
  showToast(`${templateName} template applied`);
}

// Modal initialization
function initModals() {
  // Close buttons
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  });

  // Close when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  // Export modal
  const confirmExportBtn = document.getElementById("confirmExportBtn");
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener("click", performExport);
  }

  // Table modal
  const insertTableBtn = document.getElementById("insertTableBtn");
  if (insertTableBtn) {
    insertTableBtn.addEventListener("click", () => {
      const rows = parseInt(document.getElementById("tableRows").value) || 3;
      const cols = parseInt(document.getElementById("tableCols").value) || 3;

      let tableHTML = "<table>";
      tableHTML += "<tr>";
      for (let i = 0; i < cols; i++) {
        tableHTML += `<th>Header ${i + 1}</th>`;
      }
      tableHTML += "</tr>";

      for (let i = 0; i < rows - 1; i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < cols; j++) {
          tableHTML += `<td>Cell ${i + 1}-${j + 1}</td>`;
        }
        tableHTML += "</tr>";
      }
      tableHTML += "</table>";

      document.execCommand("insertHTML", false, tableHTML);
      document.getElementById("tableModal").style.display = "none";
      markDocumentAsChanged();
      showToast("Table inserted");
    });
  }

  // Link modal
  const insertLinkBtn = document.getElementById("insertLinkBtn");
  if (insertLinkBtn) {
    insertLinkBtn.addEventListener("click", () => {
      const linkText = document.getElementById("linkText").value || "Link Text";
      const linkUrl = document.getElementById("linkUrl").value || "https://example.com";

      const linkHTML = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
      document.execCommand("insertHTML", false, linkHTML);
      document.getElementById("linkModal").style.display = "none";
      markDocumentAsChanged();
      showToast("Link inserted");
    });
  }

  // Image modal
  const insertImageBtn = document.getElementById("insertImageBtn");
  if (insertImageBtn) {
    insertImageBtn.addEventListener("click", () => {
      const imageUrl = document.getElementById("imageUrl").value;
      const imageAlt = document.getElementById("imageAlt").value || "Image";

      if (imageUrl) {
        const imageHTML = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%;">`;
        document.execCommand("insertHTML", false, imageHTML);
        markDocumentAsChanged();
      } else {
        const imageFile = document.getElementById("imageFile").files[0];
        if (imageFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageHTML = `<img src="${e.target.result}" alt="${imageAlt}" style="max-width: 100%;">`;
            document.execCommand("insertHTML", false, imageHTML);
            markDocumentAsChanged();
          };
          reader.readAsDataURL(imageFile);
        }
      }

      document.getElementById("imageModal").style.display = "none";
      showToast("Image inserted");
    });
  }

  // Chart modal
  const insertChartBtn = document.getElementById("insertChartBtn");
  if (insertChartBtn) {
    insertChartBtn.addEventListener("click", () => {
      const chartType = document.getElementById("chartType").value;
      const chartData = document.getElementById("chartData").value.split(",").map((n) => parseFloat(n.trim()));
      const chartLabels = document.getElementById("chartLabels").value.split(",").map((l) => l.trim());

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      canvas.className = "chart-canvas";

      const ctx = canvas.getContext("2d");
      drawSimpleChart(ctx, chartType, chartData, chartLabels);

      const chartContainer = document.createElement("div");
      chartContainer.className = "chart-container";
      chartContainer.appendChild(canvas);

      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.insertNode(chartContainer);
      }

      document.getElementById("chartModal").style.display = "none";
      markDocumentAsChanged();
      showToast("Chart inserted");
    });
  }

  // Shape modal
  const insertShapeBtn = document.getElementById("insertShapeBtn");
  if (insertShapeBtn) {
    insertShapeBtn.addEventListener("click", () => {
      const shapeType = document.getElementById("shapeType").value;
      const shapeColor = document.getElementById("shapeColor").value;
      const shapeSize = document.getElementById("shapeSize").value;

      const shape = document.createElement("div");
      shape.className = `shape ${shapeType} ${shapeSize}`;
      shape.style.backgroundColor = shapeColor;

      if (shapeType === "triangle") {
        const size = shapeSize === "small" ? 25 : shapeSize === "medium" ? 50 : 75;
        shape.style.borderLeft = `${size}px solid transparent`;
        shape.style.borderRight = `${size}px solid transparent`;
        shape.style.borderBottom = `${size}px solid ${shapeColor}`;
        shape.style.backgroundColor = "transparent";
      }

      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.insertNode(shape);
      }

      document.getElementById("shapeModal").style.display = "none";
      markDocumentAsChanged();
      showToast("Shape inserted");
    });
  }

  // Margins modal
  const applyMarginsBtn = document.getElementById("applyMarginsBtn");
  if (applyMarginsBtn) {
    applyMarginsBtn.addEventListener("click", () => {
      const marginTop = document.getElementById("marginTop").value + "in";
      const marginBottom = document.getElementById("marginBottom").value + "in";
      const marginLeft = document.getElementById("marginLeft").value + "in";
      const marginRight = document.getElementById("marginRight").value + "in";

      const pages = document.querySelectorAll(".page");
      pages.forEach((page) => {
        page.style.paddingTop = marginTop;
        page.style.paddingBottom = marginBottom;
        page.style.paddingLeft = marginLeft;
        page.style.paddingRight = marginRight;
      });

      document.getElementById("marginsModal").style.display = "none";
      markDocumentAsChanged();
      showToast("Margins applied");
    });
  }
}

// Simple chart drawing function
function drawSimpleChart(ctx, type, data, labels) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const padding = 40;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#333";
  ctx.font = "12px Arial";

  if (type === "bar") {
    const barWidth = (width - padding * 2) / data.length;
    const maxValue = Math.max(...data);

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * (height - padding * 2);
      const x = padding + index * barWidth;
      const y = height - padding - barHeight;

      ctx.fillStyle = `hsl(${index * 60}, 70%, 50%)`;
      ctx.fillRect(x, y, barWidth - 10, barHeight);

      ctx.fillStyle = "#333";
      ctx.fillText(labels[index] || `Item ${index + 1}`, x, height - 10);
      ctx.fillText(value.toString(), x, y - 5);
    });
  } else if (type === "pie") {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const total = data.reduce((sum, value) => sum + value, 0);

    let currentAngle = 0;
    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = `hsl(${index * 60}, 70%, 50%)`;
      ctx.fill();

      currentAngle += sliceAngle;
    });
  }
}

// Rulers initialization
function initRulers() {
  const horizontalRuler = document.querySelector(".horizontal-ruler .ruler-markers");
  const verticalRuler = document.querySelector(".vertical-ruler .ruler-markers");

  // Create horizontal ruler markers
  for (let i = 0; i < 100; i++) {
    const marker = document.createElement("div");
    marker.className = "ruler-marker";
    marker.style.position = "absolute";
    marker.style.left = i * 50 + "px";
    marker.style.top = "0";
    marker.style.width = "1px";
    marker.style.height = i % 10 === 0 ? "10px" : "5px";
    marker.style.background = "#999";

    if (i % 10 === 0) {
      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.left = i * 50 + "px";
      label.style.top = "10px";
      label.style.fontSize = "8px";
      label.style.transform = "translateX(-50%)";
      label.textContent = i;
      horizontalRuler.appendChild(label);
    }

    horizontalRuler.appendChild(marker);
  }

  // Create vertical ruler markers
  for (let i = 0; i < 100; i++) {
    const marker = document.createElement("div");
    marker.className = "ruler-marker";
    marker.style.position = "absolute";
    marker.style.top = i * 50 + "px";
    marker.style.left = "0";
    marker.style.height = "1px";
    marker.style.width = i % 10 === 0 ? "10px" : "5px";
    marker.style.background = "#999";

    if (i % 10 === 0) {
      const label = document.createElement("div");
      label.style.position = "absolute";
      label.style.top = i * 50 + "px";
      label.style.left = "12px";
      label.style.fontSize = "8px";
      label.style.transform = "translateY(-50%)";
      label.textContent = i;
      verticalRuler.appendChild(label);
    }

    verticalRuler.appendChild(marker);
  }

  // Show/hide rulers based on checkbox
  document.getElementById("showRuler").addEventListener("change", function () {
    document.querySelector(".horizontal-ruler").style.display = this.checked ? "block" : "none";
    document.querySelector(".vertical-ruler").style.display = this.checked ? "block" : "none";
  });

  // Show/hide gridlines based on checkbox
  document.getElementById("showGridlines").addEventListener("change", function () {
    document.querySelector(".page").classList.toggle("show-gridlines", this.checked);
  });
}

// Document events initialization
function initDocumentEvents() {
  const page = document.querySelector(".page");

  // Update stats when content changes
  page.addEventListener("input", () => {
    markDocumentAsChanged();
    updateDocumentStats();
  });

  // Handle paste to strip formatting
  page.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    markDocumentAsChanged();
  });

  // Print functionality
  document.getElementById("printBtn").addEventListener("click", printDocument);

  // New document functionality
  document.getElementById("newDocBtn").addEventListener("click", createNewDocument);

  // Open document functionality
  document.getElementById("openDocBtn").addEventListener("click", openDocument);

  // Save functionality
  document.getElementById("saveBtn").addEventListener("click", saveDocument);

  // Export functionality
  document.getElementById("exportBtn").addEventListener("click", exportDocument);
}

// View controls initialization
function initViewControls() {
  // Navigation panel toggle
  document.getElementById("showNavigation").addEventListener("change", function () {
    const sidebar = document.querySelector(".sidebar");
    if (this.checked) {
      sidebar.classList.remove("hidden");
    } else {
      sidebar.classList.add("hidden");
    }
  });
}

// Document statistics update
function updateDocumentStats() {
  const pages = document.querySelectorAll(".page");
  let totalText = "";

  pages.forEach((page) => {
    totalText += page.innerText + " ";
  });

  const wordCount = totalText.split(/\s+/).filter((word) => word.length > 0).length;
  const charCount = totalText.length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 500));

  // Update sidebar stats
  document.getElementById("wordCount").textContent = wordCount;
  document.getElementById("charCount").textContent = charCount;
  document.getElementById("pageCount").textContent = pageCount;

  // Update status bar
  document.getElementById("statusWordCount").textContent = wordCount;
  document.getElementById("totalPages").textContent = pageCount;

  // Update outline
  updateDocumentOutline();
}

// Document outline update
function updateDocumentOutline() {
  const outlineContainer = document.getElementById("documentOutline");
  const headings = document.querySelectorAll(".page h1, .page h2, .page h3, .page h4, .page h5, .page h6");

  outlineContainer.innerHTML = "";

  if (headings.length === 0) {
    outlineContainer.innerHTML = '<div class="outline-item">Start typing to see outline...</div>';
    return;
  }

  headings.forEach((heading, index) => {
    const outlineItem = document.createElement("div");
    outlineItem.className = "outline-item";
    outlineItem.textContent = heading.textContent;
    outlineItem.style.paddingLeft = (parseInt(heading.tagName.charAt(1)) - 1) * 15 + "px";

    outlineItem.addEventListener("click", () => {
      heading.scrollIntoView({ behavior: "smooth" });
    });

    outlineContainer.appendChild(outlineItem);
  });
}

// Toast notification function
function showToast(message = "Action successful", type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;

  // Set toast color based on type
  switch (type) {
    case "success":
      toast.style.background = "var(--success)";
      break;
    case "warning":
      toast.style.background = "var(--warning)";
      break;
    case "error":
      toast.style.background = "var(--error)";
      break;
    case "info":
      toast.style.background = "var(--primary)";
      break;
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Network background animation
function initNetworkBackground() {
  const canvas = document.getElementById("networkCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update particles
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
    });

    // Draw connections
    ctx.strokeStyle = "rgba(108, 99, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    ctx.fillStyle = "rgba(108, 99, 255, 0.3)";
    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initFontControls();
  initAutosave();
  initTemplateSelector();
  initModals();
  initRulers();
  initDocumentEvents();
  initViewControls();
  initNetworkBackground();
  updateRecentDocuments();
  createNewDocument(); // start with a new document by default

  // Ribbon Tab Switching Logic
  document.querySelectorAll(".ribbon-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".ribbon-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".ribbon-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(`${tab.dataset.tab}-panel`);
      if (panel) panel.classList.add("active");
    });
  });

  // Cursor movement
  const cursor = document.querySelector(".cursor");
  const cursorDot = document.querySelector(".cursor-dot");

  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
    cursorDot.style.left = e.clientX + "px";
    cursorDot.style.top = e.clientY + "px";
  });

  // Track document title changes
  document.getElementById("documentTitle").addEventListener("input", () => {
    markDocumentAsChanged();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          saveDocument();
          break;
        case "n":
          e.preventDefault();
          createNewDocument();
          break;
        case "o":
          e.preventDefault();
          openDocument();
          break;
        case "p":
          e.preventDefault();
          printDocument();
          break;
        case "e":
          e.preventDefault();
          exportDocument();
          break;
      }
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  });
});