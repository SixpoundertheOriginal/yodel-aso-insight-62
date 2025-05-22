import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, File, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AppDetails } from "./AppStoreScraper";

interface FileUploadSectionProps {
  onFilesUploaded: (files: File[]) => void;
  selectedApp?: AppDetails | null;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({ 
  onFilesUploaded,
  selectedApp = null
}) => {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = async (filesToProcess: File[]) => {
    setLoading(true);
    
    const validFiles = filesToProcess.filter(file => {
      // Accept CSV or TSV files
      return file.type === 'text/csv' || 
        file.type === 'text/tab-separated-values' || 
        file.name.endsWith('.csv') || 
        file.name.endsWith('.tsv');
    });
    
    if (validFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please upload CSV or TSV files with keyword data.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // For now, we'll use just the first valid file
    const fileToUse = validFiles[0];
    setFiles([fileToUse]);
    
    // Pass the file to the parent component
    onFilesUploaded([fileToUse]);
    
    setLoading(false);
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.csv')) {
      return <FileText className="h-4 w-4 text-green-400" />;
    }
    if (filename.endsWith('.tsv')) {
      return <FileText className="h-4 w-4 text-blue-400" />;
    }
    return <File className="h-4 w-4 text-gray-400" />;
  };
  
  const appNameDisplay = selectedApp ? `for ${selectedApp.trackName}` : '';

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-white">Keyword Data</CardTitle>
          {selectedApp && (
            <div className="flex items-center space-x-2">
              <img 
                src={selectedApp.artworkUrl100} 
                alt={selectedApp.trackName} 
                className="w-6 h-6 rounded-md" 
              />
              <span className="text-sm text-zinc-300">{selectedApp.trackName}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {files.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragging
                ? "border-yodel-orange bg-yodel-orange/10"
                : "border-zinc-700 hover:border-yodel-orange/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              className="hidden"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
            />
            
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Upload className="h-6 w-6 text-zinc-400" />
            </div>
            
            <h3 className="text-zinc-300 font-medium mb-1">
              Upload Keyword Data {appNameDisplay}
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Drag & drop your keyword files here or click to browse
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Badge variant="outline" className="bg-zinc-800 text-zinc-400">
                AppTweak
              </Badge>
              <Badge variant="outline" className="bg-zinc-800 text-zinc-400">
                SensorTower
              </Badge>
              <Badge variant="outline" className="bg-zinc-800 text-zinc-400">
                ASOTools
              </Badge>
              <Badge variant="outline" className="bg-zinc-800 text-zinc-400">
                Custom CSV
              </Badge>
            </div>
            
            <Button
              variant="outline"
              onClick={handleOpenFileDialog}
              className="mt-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            >
              <Upload className="mr-2 h-4 w-4" /> Select File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            ))}
            
            <div className="text-center">
              <p className="text-zinc-300 text-sm mb-2">
                File uploaded successfully!
              </p>
              <p className="text-zinc-400 text-xs">
                Now you can select an insight module to analyze your data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
