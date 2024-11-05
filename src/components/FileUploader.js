// src/components/FileUploader.js
import React from 'react';
import { Button, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { uploadFile } from '../services/fileService'; // Import your file service

const FileUploader = () => {
  const handleUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      // Upload the selected file
      const response = await uploadFile(res[0]);
      Alert.alert('File uploaded successfully!', response);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('User cancelled the upload');
      } else {
        Alert.alert('Error uploading file:', err.message);
      }
    }
  };

  return <Button title="Upload File" onPress={handleUpload} />;
};

export default FileUploader;
