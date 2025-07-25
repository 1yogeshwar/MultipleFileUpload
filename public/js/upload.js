let selectedFiles = [];
const maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
const allowedTypes = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
    'application/vnd.ms-excel': 'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'image/jpeg': 'image',
    'image/jpg': 'image',
    'image/png': 'image'
};

// Initialize drag and drop
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    files.forEach(file => {
        if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            const fileObj = {
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                id: Date.now() + Math.random(),
                isValid: validateFile(file),
                error: getFileError(file)
            };
            selectedFiles.push(fileObj);
        }
    });
    
    updateFileList();
    updateStats();
    showMessage('Files added successfully!', 'success');
}

function validateFile(file) {
    if (!allowedTypes[file.type]) {
        return false;
    }
    if (file.size > maxFileSize) {
        return false;
    }
    return true;
}

function getFileError(file) {
    if (!allowedTypes[file.type]) {
        return 'Invalid file type';
    }
    if (file.size > maxFileSize) {
        return 'File too large (max 50MB)';
    }
    return null;
}

function getFileIcon(type) {
    if (allowedTypes[type]) {
        return allowedTypes[type];
    }
    return 'other';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }

    fileList.style.display = 'block';
    fileItems.innerHTML = '';

    selectedFiles.forEach(fileObj => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const iconType = getFileIcon(fileObj.type);
        const iconText = iconType === 'pdf' ? 'PDF' : 
                        iconType === 'doc' ? 'DOC' : 
                        iconType === 'xlsx' ? 'XLS' : 
                        iconType === 'image' ? '🖼️' : '📄';

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon ${iconType}">${iconText}</div>
                <div class="file-details">
                    <div class="file-name">${fileObj.name}</div>
                    <div class="file-size">${formatFileSize(fileObj.size)}</div>
                </div>
            </div>
            <div class="file-status ${fileObj.isValid ? 'status-valid' : 'status-invalid'}">
                ${fileObj.isValid ? '✅ Valid' : '❌ ' + fileObj.error}
            </div>
            <button class="remove-btn" onclick="removeFile('${fileObj.id}')">
                ✕
            </button>
        `;
        
        fileItems.appendChild(fileItem);
    });

    // Update upload button state
    const uploadBtn = document.getElementById('uploadAllBtn');
    const validFiles = selectedFiles.filter(f => f.isValid);
    uploadBtn.disabled = validFiles.length === 0;
}

function removeFile(fileId) {
    selectedFiles = selectedFiles.filter(f => f.id !== fileId);
    updateFileList();
    updateStats();
    
    if (selectedFiles.length === 0) {
        showMessage('All files removed', 'success');
    }
}

function clearAllFiles() {
    selectedFiles = [];
    updateFileList();
    updateStats();
    document.getElementById('messageArea').innerHTML = '';
    document.getElementById('progressBar').style.display = 'none';
    showMessage('All files cleared', 'success');
}

function updateStats() {
    const stats = document.getElementById('stats');
    const totalFiles = selectedFiles.length;
    const validFiles = selectedFiles.filter(f => f.isValid).length;
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

    if (totalFiles === 0) {
        stats.style.display = 'none';
        return;
    }

    stats.style.display = 'flex';
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('validFiles').textContent = validFiles;
    document.getElementById('totalSize').textContent = formatFileSize(totalSize);
}

function showMessage(text, type) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="message ${type}">${text}</div>`;
    
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 5000);
}

async function uploadAllFiles() {
    const validFiles = selectedFiles.filter(f => f.isValid);
    
    if (validFiles.length === 0) {
        showMessage('No valid files to upload!', 'error');
        return;
    }

    // Show progress bar
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    try {
        // Create FormData object
        const formData = new FormData();
        validFiles.forEach(fileObj => {
            formData.append('documents', fileObj.file);
        });

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressFill.style.width = percentComplete + '%';
            }
        });

        xhr.addEventListener('load', () => {
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                progressBar.style.display = 'none';
                
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        showMessage(response.message, 'success');
                        
                        // Clear files after successful upload
                        setTimeout(() => {
                            clearAllFiles();
                        }, 2000);
                    } else {
                        showMessage(response.message, 'error');
                    }
                } else {
                    const errorResponse = JSON.parse(xhr.responseText);
                    showMessage(errorResponse.message || 'Upload failed', 'error');
                }
            }, 500);
        });

        xhr.addEventListener('error', () => {
            progressBar.style.display = 'none';
            showMessage('Network error occurred during upload', 'error');
        });

        xhr.open('POST', '/upload');
        xhr.send(formData);

    } catch (error) {
        progressBar.style.display = 'none';
        showMessage('Upload failed: ' + error.message, 'error');
    }
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            btn.classList.add('hovered');
        });
        btn.addEventListener('mouseleave', function() {
            btn.classList.remove('hovered');
        });
    });

    // Add click effect to upload button
    const uploadBtn = document.getElementById('uploadAllBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            uploadBtn.classList.add('clicked');
            setTimeout(() => uploadBtn.classList.remove('clicked'), 200);
            uploadAllFiles();
        });
    }

    // Add click effect to clear all button
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearBtn.classList.add('clicked');
            setTimeout(() => clearBtn.classList.remove('clicked'), 200);
            clearAllFiles();
        });
    }
});