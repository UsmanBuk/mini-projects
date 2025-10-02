# Sentiment Analysis Project

## Overview
This project provides a sentiment analysis tool that leverages artificial intelligence to analyze the emotional tone of text input. The application uses advanced AI models to determine whether a given text expresses positive, negative, or neutral sentiment.

## AI Technology Used
This project integrates with **IBM Watson's Natural Language Processing (NLP) service**, specifically utilizing:
- **BERT (Bidirectional Encoder Representations from Transformers)**: A state-of-the-art transformer-based AI model
- **Multi-language sentiment analysis**: The model supports sentiment analysis across multiple languages
- **Deep learning workflow**: Uses aggregated BERT workflows for enhanced accuracy

## Features
- Real-time sentiment analysis of text input
- AI-powered natural language understanding
- RESTful API integration with IBM Watson
- JSON-formatted response with detailed sentiment metrics
- Easy-to-use Python function interface

## How It Works
1. **Input Processing**: The application takes text input through the `sentiment_analyzer()` function
2. **AI API Call**: Sends the text to IBM Watson's sentiment analysis service using their BERT-based model
3. **AI Analysis**: The Watson AI service processes the text using advanced machine learning algorithms
4. **Result Return**: Returns detailed sentiment analysis results in JSON format

## Usage
```python
from sentiment_analysis import sentiment_analyzer

# Analyze sentiment of text
result = sentiment_analyzer("I am very happy today")
print(result)
```

## Technical Details
- **AI Model**: `sentiment_aggregated-bert-workflow_lang_multi_stock` 
- **API Endpoint**: Watson Runtime NLP Service
- **Method**: POST request with JSON payload
- **Response Format**: JSON with sentiment predictions and confidence scores

## Requirements
- Python 3.x
- `requests` library for HTTP requests
- `json` library for data parsing
- Internet connection for API access

## Installation
1. Clone this repository
2. Install required dependencies:
   ```bash
   pip install requests
   ```
3. Run the sentiment analysis:
   ```python
   python sentiment_analysis.py
   ```

## AI Capabilities
This project demonstrates the power of modern AI in natural language processing by:
- Understanding context and nuance in human language
- Providing confidence scores for sentiment predictions
- Supporting multiple languages through AI model training
- Leveraging transformer architecture (BERT) for superior accuracy

## Example Output
The AI model returns detailed analysis including sentiment labels, confidence scores, and other linguistic insights derived from the deep learning model's processing of the input text.

---
*This project showcases practical AI implementation in sentiment analysis using cutting-edge transformer models and cloud-based AI services.*
