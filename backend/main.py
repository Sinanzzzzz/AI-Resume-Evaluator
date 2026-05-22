from flask import Flask, request, jsonify
from flask_cors import CORS
from pdfminer.high_level import extract_text
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from groq import Groq
from dotenv import load_dotenv
import os, re, tempfile, math
from typing import List, Dict
import json



app = Flask(__name__)
CORS(app)

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
print("API KEY LOADED:", api_key is not None)

print("Loading SentenceTransformer model...")
model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
print("Model loaded successfully")



def clean_text(text):
    text = re.sub(r"\s+", " ", str(text))
    return text.strip().lower()

def truncate_text(text, max_chars):
    return text[:max_chars]



def semantic_similarity(a, b):
    emb1 = model.encode([a], convert_to_numpy=True)
    emb2 = model.encode([b], convert_to_numpy=True)
    return float(cosine_similarity(emb1, emb2)[0][0])

def keyword_match_score(resume, jd):
    resume_words = set(resume.split())
    jd_words = set(jd.split())
    if not jd_words:
        return 0.0
    return len(resume_words & jd_words) / len(jd_words)

def ats_scale(similarity):
    scaled = 1 / (1 + math.exp(-12 * (similarity - 0.45)))
    boosted = 0.35 + (scaled * 0.65)
    return round(min(max(boosted, 0.3), 0.95), 2)

def compute_ats_score(resume_text, job_desc):
    sim = semantic_similarity(resume_text, job_desc)
    kw = keyword_match_score(resume_text, job_desc)

    ats_score = round(
        (0.75 * ats_scale(sim)) +
        (0.25 * kw),
        2
    )

    return ats_score

def ats_percentage(ats_score):
    return round(ats_score * 100, 1)

def role_fit_label(ats_score):
    if ats_score >= 0.85:
        return "Excellent Fit"
    elif ats_score >= 0.70:
        return "Strong Fit"
    elif ats_score >= 0.55:
        return "Moderate Fit"
    else:
        return "Low Fit"

def ats_breakdown(resume_text, job_desc):
    sim = semantic_similarity(resume_text, job_desc)
    kw = keyword_match_score(resume_text, job_desc)

    return {
        "semantic_match": round(sim * 100, 1),
        "keyword_match": round(kw * 100, 1),
        "overall_ats": ats_percentage(
            compute_ats_score(resume_text, job_desc)
        )
    }


def missing_keywords(resume, jd, top_k=15):
    resume_text = resume.lower()
    jd_text = jd.lower()

    stopwords = {
        "and", "or", "the", "a", "an", "to", "for", "with",
        "of", "in", "on", "by", "as", "is", "are", "was", "were",
        "full", "stack", "developer", "engineer", "role", "job",
        "position", "candidate", "required", "experience"
    }

    jd_words = re.findall(r"\b[a-zA-Z]{3,}\b", jd_text)
    important_jd_words = [w for w in jd_words if w not in stopwords]
    missing = [w for w in important_jd_words if w not in resume_text]

    return list(dict.fromkeys(missing))[:top_k]



def ats_format_warnings(resume_text):
    """Comprehensive ATS formatting warnings"""
    warnings = []
    
  
    if len(resume_text) < 500:
        warnings.append("Resume content is too short (less than 500 characters)")
    elif len(resume_text) > 5000:
        warnings.append("Resume may be too lengthy (over 5000 characters) - consider condensing")
    
   
    if resume_text.count("\n") < 5:
        warnings.append("Resume appears poorly structured - add section breaks")
    
    
    if "@" not in resume_text:
        warnings.append("Email address not detected in resume")
    if not re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
        warnings.append("Phone number format not detected")
    
    
    if not re.search(r"\b(19|20)\d{2}\b", resume_text):
        warnings.append("No employment years detected (e.g., 2020-2023)")
    
    
    if re.search(r'[^\x00-\x7F]', resume_text):
        warnings.append("Non-ASCII characters detected - may cause ATS parsing issues")
    
   
    if "table" in resume_text.lower() or "column" in resume_text.lower():
        warnings.append("Possible table formatting detected - ATS may not parse correctly")
    
    if len(re.findall(r'http[s]?://', resume_text)) > 5:
        warnings.append("Too many URLs detected - consider reducing links")
    
    return warnings

def get_resume_metrics(resume_text):
    """Calculate basic resume metrics"""
    return {
        "word_count": len(resume_text.split()),
        "character_count": len(resume_text),
        "section_count": resume_text.count("\n\n"),
        "has_email": "@" in resume_text,
        "has_phone": bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text)),
        "has_dates": bool(re.search(r"\b(19|20)\d{2}\b", resume_text))
    }



def get_comprehensive_report(resume, jd, format_warnings, missing_kw):
    resume = truncate_text(resume, 3000)
    jd = truncate_text(jd, 1500)

    client = Groq(api_key=api_key)

    
    warnings_text = "\n".join(format_warnings) if format_warnings else "None"
    missing_text = ", ".join(missing_kw[:10]) if missing_kw else "None"

    prompt = f"""
You are an AI Resume Intelligence Agent.
Analyze the resume against the job description.

Resume:
{resume}

Job Description:
{jd}

Detected Formatting Issues:
{warnings_text}

Missing Keywords Detected:
{missing_text}

Respond strictly in this format:

## ATS COMPATIBILITY ANALYSIS
Overall Match: X/5 stars
Brief explanation of the match quality and ATS readability.

## KEY STRENGTHS
1. First major strength
2. Second major strength
3. Third major strength

## CRITICAL ISSUES & GAPS
### Missing Skills
1. Skill - Context why it is needed
2. Skill - Context why it is needed
3. Skill - Context why it is needed

### ATS Formatting Warnings
1. Specific formatting issue and impact
2. Specific formatting issue and impact

## RECOMMENDED JOB ROLES
Based on the candidate's skills and experience:
1. Job Role Title - Why they're a good fit (2-3 sentences)
2. Job Role Title - Why they're a good fit (2-3 sentences)
3. Job Role Title - Why they're a good fit (2-3 sentences)
4. Job Role Title - Why they're a good fit (2-3 sentences)

## ATS OPTIMIZATION RECOMMENDATIONS
1. Specific actionable tip to improve ATS score
2. Specific actionable tip to improve ATS score
3. Specific actionable tip to improve ATS score
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return "Analysis unavailable due to server load."



def generate_improved_resume(resume, jd):
    resume = truncate_text(resume, 3500)
    jd = truncate_text(jd, 1800)

    client = Groq(api_key=api_key)

    prompt = f"""
You are an expert ATS Resume Optimizer.
Task: Rewrite the resume to maximize ATS compatibility while maintaining truthfulness.

Original Resume:
{resume}

Target Job Description:
{jd}

Requirements:
1. Keep all information truthful.
2. Incorporate keywords naturally.
3. Quantify achievements.
4. **CRITICAL: Output ONLY valid JSON.** No markdown, no code blocks, no explanatory text before or after.

Output this exact JSON structure (fill with actual data):
{{
  "name": "Full Name",
  "title": "Professional Title",
  "contact": {{
    "phone": "Phone Number",
    "email": "Email",
    "location": "City, State",
    "linkedin": "LinkedIn URL or empty string",
    "github": "GitHub URL or empty string",
    "website": "Website URL or empty string"
  }},
  "summary": "A concise, powerful professional summary...",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Date Range (e.g., Jan 2020 - Present)",
      "description": [
        "Action-oriented bullet point 1 focusing on achievements.",
        "Bullet point 2 with quantified metrics."
      ]
    }}
  ],
  "education": [
    {{
      "institution": "University Name",
      "degree": "Degree and Field of Study",
      "year": "Year"
    }}
  ]
}}

REMEMBER: Output ONLY the JSON object. Start with {{ and end with }}.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        raw_response = response.choices[0].message.content.strip()
        
        
       
        if raw_response.startswith("```"):
            raw_response = re.sub(r'^```(?:json)?\s*', '', raw_response)
            raw_response = re.sub(r'\s*```$', '', raw_response)
        
       
        json_match = re.search(r'\{[\s\S]*\}', raw_response)
        if json_match:
            raw_response = json_match.group(0)
        
        return raw_response.strip()
    except Exception as e:
        print(f"Resume generation error: {str(e)}")
        return json.dumps({"error": f"Resume generation failed: {str(e)}"})



def generate_ai_roadmap(resume_text: str, job_desc: str, missing_kw: List[str]) -> str:
    """
    TRUE agentic behavior:
    - Goal-driven
    - Self-reflecting
    - Iterative improvement loop
    """

    resume_clean = clean_text(truncate_text(resume_text, 2000))
    job_desc_clean = clean_text(truncate_text(job_desc, 2000))
    missing_list = missing_kw[:15] if missing_kw else []

    client = Groq(api_key=api_key)

    
    agent_state = {
        "goal": "Create the most effective learning roadmap to close hiring gaps",
        "plan": "",
        "reflection": "",
        "iteration": 0
    }

    MAX_ITERATIONS = 2  

    while agent_state["iteration"] < MAX_ITERATIONS:
        agent_state["iteration"] += 1

       
        plan_prompt = f"""
You are a Senior Technical Career Architect Agent.

GOAL:
{agent_state['goal']}

CONTEXT:
Resume: {resume_clean[:800]}...
Job Description: {job_desc_clean[:800]}...
Missing Skills: {', '.join(missing_list) if missing_list else "Focus on advanced role expectations."}

TASK:
Create a structured, high-impact learning roadmap.

OUTPUT FORMAT (strict):

## 🧠 Strategic Analysis
## 📅 Phase 1: Core Foundation (Weeks 1-4)
## 🚀 Phase 2: Advanced Application (Weeks 5-8)
## 🛠️ Recommended Projects
## 📚 Curated Resources
"""

        plan_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": plan_prompt}],
            temperature=0.6,
            max_tokens=900
        )

        agent_state["plan"] = plan_response.choices[0].message.content

        
        reflection_prompt = f"""
You are a critical AI reviewer.

Review the roadmap below and identify:
1. Gaps in skill coverage
2. Poor sequencing
3. Missing practical depth

Respond with:
- "APPROVED" if roadmap is strong
- OR a short critique listing improvements needed

ROADMAP:
{agent_state['plan']}
"""

        reflection_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": reflection_prompt}],
            temperature=0.3,
            max_tokens=300
        )

        agent_state["reflection"] = reflection_response.choices[0].message.content.strip()

        
        if "APPROVED" in agent_state["reflection"].upper():
            break  # goal satisfied

       
        improvement_prompt = f"""
Improve the roadmap using the critique below.
Fix all weaknesses without adding fluff.

CRITIQUE:
{agent_state['reflection']}

ORIGINAL ROADMAP:
{agent_state['plan']}
"""

        improvement_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": improvement_prompt}],
            temperature=0.5,
            max_tokens=900
        )

        agent_state["plan"] = improvement_response.choices[0].message.content

    return agent_state["plan"]

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        resume_file = request.files["resume"]
        job_desc = clean_text(request.form["job_desc"])

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            resume_file.save(tmp.name)
            resume_text = extract_text(tmp.name)

        resume_text_clean = clean_text(resume_text)

       
        ats_score = compute_ats_score(resume_text_clean, job_desc)
        ats_pct = ats_percentage(ats_score)
        
       
        breakdown = ats_breakdown(resume_text_clean, job_desc)
        missing = missing_keywords(resume_text_clean, job_desc)
        format_warnings = ats_format_warnings(resume_text)
        metrics = get_resume_metrics(resume_text)
        
       
        report = get_comprehensive_report(resume_text, job_desc, format_warnings, missing)
        
       
        ai_roadmap = generate_ai_roadmap(resume_text, job_desc, missing)

        return jsonify({
            "ats_score": ats_score,
            "ats_percentage": ats_pct,
            "fit_label": role_fit_label(ats_score),
            "breakdown": breakdown,
            "missing_keywords": missing,
            "format_warnings": format_warnings,
            "resume_metrics": metrics,
            "report": report,
            "original_resume": resume_text,
            "ai_roadmap": ai_roadmap
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/improve", methods=["POST"])
def improve_resume():
    try:
        data = request.json
        resume = data.get("resume", "")
        job_desc = data.get("job_desc", "")

        if not resume or not job_desc:
            return jsonify({"success": False, "error": "Resume and job description are required"}), 400

        print("Starting resume improvement...")
        
        
        improved_resume_json_str = generate_improved_resume(resume, job_desc)
        
        print(f"Raw AI Response (first 500 chars): {improved_resume_json_str[:500]}")
        
        
        try:
            improved_resume_data = json.loads(improved_resume_json_str)
            
           
            if "error" in improved_resume_data:
                print(f"AI returned error: {improved_resume_data['error']}")
                return jsonify({"success": False, "error": improved_resume_data["error"]}), 500

            
            required_fields = ['name', 'contact', 'experience']
            for field in required_fields:
                if field not in improved_resume_data:
                    return jsonify({
                        "success": False, 
                        "error": f"AI response missing required field: {field}"
                    }), 500

           
            improved_resume_text = f"{improved_resume_data.get('name', '')}\n{improved_resume_data.get('title', '')}\n"
            improved_resume_text += f"Summary: {improved_resume_data.get('summary', '')}\n"
            
            
            skills = improved_resume_data.get('skills', [])
            if skills:
                improved_resume_text += f"Skills: {', '.join(skills)}\n"
            
            
            for exp in improved_resume_data.get('experience', []):
                improved_resume_text += f"{exp.get('company', '')} - {exp.get('role', '')}\n"
                improved_resume_text += f"{exp.get('duration', '')}\n"
                descriptions = exp.get('description', [])
                if descriptions:
                    improved_resume_text += '. '.join(descriptions) + '\n'
            
            
            for edu in improved_resume_data.get('education', []):
                improved_resume_text += f"{edu.get('institution', '')} - {edu.get('degree', '')} ({edu.get('year', '')})\n"
            
            print(f"Improved resume text length: {len(improved_resume_text)} chars")
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            print(f"Failed to parse: {improved_resume_json_str[:200]}")
            return jsonify({
                "success": False, 
                "error": f"AI generated invalid resume format. Please try again. Error: {str(e)}"
            }), 500
        
       
        resume_clean = clean_text(resume)
        job_desc_clean = clean_text(job_desc)
        improved_clean = clean_text(improved_resume_text)

        print("Calculating ATS scores...")
        before_score = ats_percentage(compute_ats_score(resume_clean, job_desc_clean))
        after_score = ats_percentage(compute_ats_score(improved_clean, job_desc_clean))
        
        print(f"Before score: {before_score}%, After score: {after_score}%")
        
       
        print("Running additional analysis...")
        missing = missing_keywords(improved_clean, job_desc_clean)
        format_warnings = ats_format_warnings(improved_resume_text)
        ai_roadmap = generate_ai_roadmap(improved_resume_text, job_desc, missing)
        final_report = get_comprehensive_report(improved_resume_text, job_desc, format_warnings, missing)

        print("Improvement complete, returning results...")
        
        return jsonify({
            "success": True,
            "before_resume": resume,
           
            "after_resume_data": improved_resume_data, 
            "after_resume_text": improved_resume_text,
            "before_score": before_score,
            "after_score": after_score,
            "improvement": round(after_score - before_score, 1),
            "before_fit": role_fit_label(before_score/100),
            "after_fit": role_fit_label(after_score/100),
            "final_report": final_report,
            "ai_roadmap": ai_roadmap
        })

    except Exception as e:
        print(f"Unexpected error in /improve endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)