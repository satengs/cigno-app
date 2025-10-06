'use client';

import { useState, useRef } from 'react';
import Modal from './modals/Modal';
import Button from './buttons/Button';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Download
} from 'lucide-react';

export default function UploadDocumentModal({ 
  isOpen, 
  onClose, 
  onDocumentProcessed,
  loading = false
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    'application/pdf': { icon: FileText, label: 'PDF Document' },
    'application/msword': { icon: FileText, label: 'Word Document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word Document' },
    'application/vnd.ms-powerpoint': { icon: FileText, label: 'PowerPoint' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileText, label: 'PowerPoint' },
    'text/plain': { icon: FileText, label: 'Text File' },
    'image/jpeg': { icon: Image, label: 'JPEG Image' },
    'image/png': { icon: Image, label: 'PNG Image' },
    'image/gif': { icon: Image, label: 'GIF Image' }
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 5;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = {};

    newFiles.forEach((file, index) => {
      // Check file type
      if (!supportedTypes[file.type]) {
        newErrors[`file_${index}`] = `Unsupported file type: ${file.type}`;
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newErrors[`file_${index}`] = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max: 10MB)`;
        return;
      }

      // Check total file count
      if (files.length + validFiles.length >= maxFiles) {
        newErrors[`file_${index}`] = `Maximum ${maxFiles} files allowed`;
        return;
      }

      validFiles.push({
        file,
        id: Date.now() + index,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready' // ready, uploading, processed, error
      });
    });

    setFiles(prev => [...prev, ...validFiles]);
    setErrors(newErrors);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processDocuments = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setUploadProgress(0);
    
    try {
      // Update file statuses to uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      const formData = new FormData();
      files.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call document processing API
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setProcessedData(result.data);
        setFiles(prev => prev.map(f => ({ ...f, status: 'processed' })));
        
        // Show success state for a moment before proceeding
        setTimeout(() => {
          onDocumentProcessed(result.data);
        }, 1000);
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      console.error('Error processing documents:', error);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      setErrors({ processing: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const getFileIcon = (fileType) => {
    const config = supportedTypes[fileType];
    if (!config) return File;
    return config.icon;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Project Documents"
      subtitle="Upload documents to extract project information automatically"
      size="lg"
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Drop files here or click to browse
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Support for PDF, Word, PowerPoint, text files, and images
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum {maxFiles} files, up to 10MB each
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto"
            >
              Choose Files
            </Button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Selected Files ({files.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileObj) => {
                const FileIcon = getFileIcon(fileObj.type);
                const isProcessed = fileObj.status === 'processed';
                const isError = fileObj.status === 'error';
                const isUploading = fileObj.status === 'uploading';
                
                return (
                  <div
                    key={fileObj.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg ${
                      isError ? 'border-red-200 bg-red-50' :
                      isProcessed ? 'border-green-200 bg-green-50' :
                      isUploading ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      isError ? 'text-red-500' :
                      isProcessed ? 'text-green-500' :
                      isUploading ? 'text-blue-500' :
                      'text-gray-400'
                    }`}>
                      {isError ? <AlertCircle className="w-5 h-5" /> :
                       isProcessed ? <CheckCircle className="w-5 h-5" /> :
                       <FileIcon className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileObj.size)} • {supportedTypes[fileObj.type]?.label}
                      </p>
                      {isUploading && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isProcessed && (
                        <>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="space-y-2">
            {Object.entries(errors).map(([key, error]) => (
              <div key={key} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ))}
          </div>
        )}

        {/* Processing Status */}
        {processing && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Processing documents...
                </p>
                <p className="text-xs text-blue-700">
                  Extracting project information using AI analysis
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {processedData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Documents processed successfully!
                </p>
                <p className="text-xs text-green-700">
                  Extracted project information and creating your project...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={processDocuments}
            disabled={files.length === 0 || processing || processedData}
            className="flex items-center space-x-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Process Documents</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}