# 🤖 AI Voice Assistant

A smart browser-based AI Voice Assistant built with **Python, Flask, HTML, CSS and JavaScript**.

## ✨ Features

- 🎤 Voice recognition using the Web Speech API
- 🔊 Voice responses using Speech Synthesis
- 🌐 English, Hindi and Hinglish support
- 👋 Time-based greetings
- 🕐 Current time and date
- 🌍 World clock for multiple cities
- ☁️ World weather using Open-Meteo
- 🧮 Voice and 3D calculator
- 📚 History knowledge section
- 🔎 Web Search and General Questions
- 🤖 AI Chat / Smart Answer system
- 🕘 SQLite command history
- 🎨 Modern futuristic 3D-style interface
- 🛑 Standby mode with “Chalu” wake command

## 🛠️ Technologies

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- SQLite
- Web Speech API
- Open-Meteo API
- DuckDuckGo Instant Answer API

## 📁 Project Structure

```text
AI-Voice-Assistant/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AI-Voice-Assistant
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the application

```bash
python app.py
```

### 4. Open in browser

```text
http://127.0.0.1:5000
```

> Use a modern browser such as Chrome and allow microphone permission when prompted.

## 🎤 Example Voice Commands

```text
Hello
What is my name?
What is Python?
AI batao what is machine learning
Delhi weather batao
London ka time batao
Calculate 25 plus 10
World War 2 history batao
Open Google
Open YouTube
Band
Chalu
```

## 🔎 Web Search

The project uses the DuckDuckGo Instant Answer API for its web-search/general-question fallback. It requires an internet connection and does not guarantee full search-engine results for every query.

## ☁️ Weather

Weather information is retrieved from Open-Meteo. No API key is required for the current implementation.

## 🗄️ Database

SQLite is used for command history. The local `assistant.db` file is intentionally ignored by Git so personal/local command history is not uploaded to the public repository.

## 🚀 Future Improvements

- Advanced conversational AI integration
- User authentication
- Calendar and reminders
- News integration
- Desktop application using Electron
- More languages
- Larger knowledge base

## 👨‍💻 Developer

**Abhay Solanki**  
B.Tech CSE (Data Science)  
ITS Engineering College

## 📌 License

This project is intended for educational and portfolio purposes.
