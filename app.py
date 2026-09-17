from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
import urllib.parse
import urllib.request
import json

app = Flask(__name__)

DB_NAME = "assistant.db"


# ==================================================
# DATABASE
# ==================================================

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS command_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_command TEXT NOT NULL,
            assistant_response TEXT NOT NULL,
            command_type TEXT,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def save_command(user_command, assistant_response, command_type="general"):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO command_history
        (user_command, assistant_response, command_type, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        user_command,
        assistant_response,
        command_type,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()


def get_history():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM command_history
        ORDER BY id DESC
        LIMIT 50
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def clear_history():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM command_history")

    conn.commit()
    conn.close()


# ==================================================
# HOME
# ==================================================

@app.route("/")
def home():
    return render_template("index.html")


# ==================================================
# COMMAND HISTORY API
# ==================================================

@app.route("/save-command", methods=["POST"])
def save_command_api():

    data = request.get_json() or {}

    user_command = data.get(
        "user_command",
        ""
    ).strip()

    assistant_response = data.get(
        "assistant_response",
        ""
    ).strip()

    command_type = data.get(
        "command_type",
        "general"
    )

    if user_command and assistant_response:

        save_command(
            user_command,
            assistant_response,
            command_type
        )

    return jsonify({
        "success": True
    })


@app.route("/history", methods=["GET"])
def history_api():

    return jsonify({
        "success": True,
        "history": get_history()
    })


@app.route("/clear-history", methods=["DELETE"])
def clear_history_api():

    clear_history()

    return jsonify({
        "success": True,
        "message": "History cleared successfully"
    })


# ==================================================
# WEB SEARCH
# ==================================================

def search_web(query):

    try:

        encoded_query = urllib.parse.quote(query)

        url = (
            "https://api.duckduckgo.com/"
            "?q=" + encoded_query
            + "&format=json"
            + "&no_html=1"
            + "&skip_disambig=1"
        )

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent":
                "AI-Voice-Assistant/1.0"
            }
        )

        with urllib.request.urlopen(
            req,
            timeout=10
        ) as response:

            data = json.loads(
                response.read().decode("utf-8")
            )

        # Direct answer
        abstract = data.get(
            "AbstractText",
            ""
        )

        if abstract:

            return {
                "success": True,
                "answer": abstract,
                "source": data.get(
                    "AbstractSource",
                    "DuckDuckGo"
                ),
                "url": data.get(
                    "AbstractURL",
                    ""
                )
            }

        # Related results
        related_topics = data.get(
            "RelatedTopics",
            []
        )

        results = []

        def collect_topics(topics):

            for topic in topics:

                if "Text" in topic:

                    results.append({
                        "text": topic.get(
                            "Text",
                            ""
                        ),
                        "url": topic.get(
                            "FirstURL",
                            ""
                        )
                    })

                elif "Topics" in topic:

                    collect_topics(
                        topic["Topics"]
                    )

                if len(results) >= 5:
                    break

        collect_topics(
            related_topics
        )

        if results:

            return {
                "success": True,
                "answer": results[0]["text"],
                "source": "DuckDuckGo",
                "url": results[0]["url"],
                "results": results
            }

        return {
            "success": False,
            "answer":
            "Search results nahi mile."
        }

    except Exception as error:

        print(
            "WEB SEARCH ERROR:",
            error
        )

        return {
            "success": False,
            "answer":
            "Internet search abhi available nahi hai."
        }


@app.route(
    "/web-search",
    methods=["POST"]
)
def web_search_api():

    data = request.get_json() or {}

    query = data.get(
        "query",
        ""
    ).strip()

    if not query:

        return jsonify({
            "success": False,
            "answer":
            "Please search query enter karein."
        })

    result = search_web(query)

    return jsonify(result)


# ==================================================
# AI CHAT / SMART ANSWER
# ==================================================

def smart_answer(question):

    q = question.lower().strip()

    # ----------------------------------------------
    # INTRODUCTION
    # ----------------------------------------------

    if (
        "who are you" in q
        or "tum kaun ho" in q
        or "aap kaun ho" in q
    ):

        return (
            "Main AI Voice Assistant hoon. "
            "Main voice commands samajh sakta hoon "
            "aur time, date, weather, calculation, "
            "history aur general questions mein "
            "aapki help kar sakta hoon."
        )

    # ----------------------------------------------
    # PYTHON
    # ----------------------------------------------

    if (
        "what is python" in q
        or "python kya hai" in q
    ):

        return (
            "Python ek high-level, interpreted "
            "programming language hai. Iska use "
            "web development, data science, "
            "artificial intelligence, machine "
            "learning aur automation mein kiya "
            "jata hai."
        )

    # ----------------------------------------------
    # JAVA
    # ----------------------------------------------

    if (
        "what is java" in q
        or "java kya hai" in q
    ):

        return (
            "Java ek object-oriented programming "
            "language hai. Iska use web applications, "
            "Android development, enterprise software "
            "aur backend systems mein kiya jata hai."
        )

    # ----------------------------------------------
    # JAVASCRIPT
    # ----------------------------------------------

    if (
        "what is javascript" in q
        or "javascript kya hai" in q
    ):

        return (
            "JavaScript ek programming language hai "
            "jo websites ko interactive banane ke "
            "liye use hoti hai. Node.js ke through "
            "backend development mein bhi iska use "
            "kiya ja sakta hai."
        )

    # ----------------------------------------------
    # HTML
    # ----------------------------------------------

    if (
        "what is html" in q
        or "html kya hai" in q
    ):

        return (
            "HTML ka full form HyperText Markup "
            "Language hai. Iska use web pages ka "
            "structure banane ke liye kiya jata hai."
        )

    # ----------------------------------------------
    # CSS
    # ----------------------------------------------

    if (
        "what is css" in q
        or "css kya hai" in q
    ):

        return (
            "CSS ka full form Cascading Style Sheets "
            "hai. Iska use website ke colors, fonts, "
            "layout, spacing aur animations ke liye "
            "kiya jata hai."
        )

    # ----------------------------------------------
    # FLASK
    # ----------------------------------------------

    if (
        "what is flask" in q
        or "flask kya hai" in q
    ):

        return (
            "Flask Python ka lightweight web framework "
            "hai. Iska use web applications aur APIs "
            "banane ke liye kiya jata hai."
        )

    # ----------------------------------------------
    # DATABASE
    # ----------------------------------------------

    if (
        "what is database" in q
        or "database kya hai" in q
    ):

        return (
            "Database ek organized collection of data "
            "hota hai jise efficiently store, manage "
            "aur retrieve kiya ja sakta hai."
        )

    # ----------------------------------------------
    # DBMS
    # ----------------------------------------------

    if (
        "what is dbms" in q
        or "dbms kya hai" in q
    ):

        return (
            "DBMS ka full form Database Management "
            "System hai. Ye software database ko "
            "create, store, update aur manage karne "
            "mein help karta hai."
        )

    # ----------------------------------------------
    # DSA
    # ----------------------------------------------

    if (
        "what is dsa" in q
        or "dsa kya hai" in q
    ):

        return (
            "DSA ka full form Data Structures and "
            "Algorithms hai. Data structures data "
            "ko organize karte hain aur algorithms "
            "problems ko efficiently solve karne ke "
            "steps provide karte hain."
        )

    # ----------------------------------------------
    # MACHINE LEARNING
    # ----------------------------------------------

    if (
        "what is machine learning" in q
        or "machine learning kya hai" in q
    ):

        return (
            "Machine Learning Artificial Intelligence "
            "ki ek branch hai jisme computer systems "
            "data se patterns learn karte hain aur "
            "predictions ya decisions perform karte hain."
        )

    # ----------------------------------------------
    # ARTIFICIAL INTELLIGENCE
    # ----------------------------------------------

    if (
        "what is artificial intelligence" in q
        or "what is ai" in q
        or "ai kya hai" in q
    ):

        return (
            "Artificial Intelligence yani AI computer "
            "systems ko aise tasks perform karne ki "
            "ability deta hai jinke liye normally "
            "human intelligence ki zarurat hoti hai, "
            "jaise learning, reasoning aur language "
            "understanding."
        )

    # ----------------------------------------------
    # DATA SCIENCE
    # ----------------------------------------------

    if (
        "what is data science" in q
        or "data science kya hai" in q
    ):

        return (
            "Data Science ek field hai jisme data ko "
            "collect, clean, analyze aur visualize "
            "karke useful insights aur predictions "
            "nikali jati hain."
        )

    # ----------------------------------------------
    # OOP
    # ----------------------------------------------

    if (
        "what is oop" in q
        or "oop kya hai" in q
        or "object oriented programming" in q
    ):

        return (
            "OOP ka full form Object Oriented "
            "Programming hai. Is programming approach "
            "mein objects aur classes ka use karke "
            "software design kiya jata hai."
        )

    # ----------------------------------------------
    # SQL
    # ----------------------------------------------

    if (
        "what is sql" in q
        or "sql kya hai" in q
    ):

        return (
            "SQL ka full form Structured Query "
            "Language hai. Iska use relational "
            "databases mein data ko create, read, "
            "update aur delete karne ke liye hota hai."
        )

    # ----------------------------------------------
    # INTERVIEW
    # ----------------------------------------------

    if (
        "interview tips" in q
        or "interview ke tips" in q
        or "how to prepare for interview" in q
    ):

        return (
            "Interview preparation ke liye apna "
            "resume achhe se samjhein, technical "
            "concepts revise karein, projects ko "
            "explain karne ki practice karein aur "
            "common HR questions ke answers prepare "
            "karein."
        )

    # ----------------------------------------------
    # STUDY
    # ----------------------------------------------

    if (
        "how to study" in q
        or "kaise padhu" in q
        or "padhai kaise kare" in q
    ):

        return (
            "Effective study ke liye daily small "
            "goals set karein, difficult topics ko "
            "priority dein, concepts ko practice "
            "karein aur regular revision karein."
        )

    # ----------------------------------------------
    # FLASK PROJECT
    # ----------------------------------------------

    if (
        "flask project" in q
        or "flask application" in q
    ):

        return (
            "Flask project mein generally Python "
            "backend, HTML templates, CSS, JavaScript "
            "aur optional database use kiya ja sakta hai. "
            "Flask routes browser requests ko handle "
            "karte hain."
        )

    # ----------------------------------------------
    # FALLBACK TO WEB SEARCH
    # ----------------------------------------------

    result = search_web(question)

    if result.get("success"):

        return result.get(
            "answer",
            "Mujhe iska answer nahi mila."
        )

    return (
        "Mujhe is question ka exact answer nahi mila. "
        "Aap question ko thoda different way mein "
        "pooch sakte hain."
    )


@app.route(
    "/ai-chat",
    methods=["POST"]
)
def ai_chat():

    data = request.get_json() or {}

    question = data.get(
        "question",
        ""
    ).strip()

    if not question:

        return jsonify({
            "success": False,
            "answer":
            "Please question enter karein."
        })

    answer = smart_answer(question)

    save_command(
        question,
        answer,
        "AI Chat"
    )

    return jsonify({
        "success": True,
        "answer": answer
    })


# ==================================================
# START APPLICATION
# ==================================================

if __name__ == "__main__":

    init_db()

    print()
    print("========================================")
    print("          AI VOICE ASSISTANT")
    print("========================================")
    print("Server : http://127.0.0.1:5000")
    print("Database : assistant.db")
    print("AI Chat : ENABLED")
    print("Web Search : ENABLED")
    print("========================================")
    print()

    app.run(debug=True)
