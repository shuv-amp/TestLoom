<template>
  <div class="question-uploader">
    <div class="upload-area" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop">
      <input
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="file-input"
      />
      <div class="upload-content">
        <div class="upload-icon">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <p>Drag & drop your question paper here</p>
        <p class="or">or</p>
        <button class="upload-btn">Browse Files</button>
      </div>
    </div>

    <div v-if="processing" class="processing-status">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <p>Processing your question paper...</p>
    </div>

    <div v-if="results" class="ocr-results">
      <h3>Extracted Questions</h3>
      <div class="questions-list">
        <div
          v-for="(question, index) in results.questions"
          :key="index"
          class="question-item"
        >
          <p>{{ question }}</p>
        </div>
      </div>
      <button @click="createQuiz" class="create-quiz-btn">Create Quiz</button>
    </div>
  </div>
</template>

<script>
import { OCRService } from '@/services/ocr/ocrService';

export default {
  name: 'QuestionUploader',
  data() {
    return {
      file: null,
      processing: false,
      progress: 0,
      results: null,
      ocrService: new OCRService()
    };
  },
  methods: {
    handleFileSelect(event) {
      this.file = event.target.files[0];
      if (this.file) {
        this.processFile();
      }
    },
    handleDrop(event) {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.file = files[0];
        this.processFile();
      }
    },
    async processFile() {
      this.processing = true;
      this.progress = 0;
      
      try {
        this.results = await this.ocrService.processImage(this.file);
        this.progress = 100;
      } catch (error) {
        console.error('Error processing file:', error);
        this.$toast.error('Failed to process question paper');
      } finally {
        this.processing = false;
      }
    },
    createQuiz() {
      // TODO: Implement quiz creation logic
      this.$emit('quiz-created', this.results.questions);
    }
  },
  beforeDestroy() {
    this.ocrService.cleanup();
  }
};
</script>

<style scoped>
.question-uploader {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #007bff;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  color: #666;
}

.or {
  color: #666;
}

.upload-btn {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #0056b3;
}

.processing-status {
  margin-top: 2rem;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #eee;
  border-radius: 5px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress {
  height: 100%;
  background-color: #007bff;
  width: 0;
  transition: width 0.3s;
}

.ocr-results {
  margin-top: 2rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.questions-list {
  margin-top: 1rem;
}

.question-item {
  margin: 1rem 0;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.create-quiz-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-quiz-btn:hover {
  background-color: #218838;
}
</style>
