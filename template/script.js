
const toggle = document.getElementById("themeToggle");
if (toggle) {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const currentTheme = document.body.classList.contains("light") ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
  });
}


let currentResumeText = "";
let currentJobDesc = "";

window.improvedResumeData = null;


const form = document.getElementById("resumeForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const output = document.getElementById("output");
    const improvementSection = document.getElementById("improvementSection");
    const improvementResults = document.getElementById("improvementResults");

    improvementSection.style.display = "none";
    improvementResults.style.display = "none";

    output.innerHTML = `<div class="ats-score" style="opacity:0.7;">🔍 Initializing Agentic Analysis...</div>`;

    try {
      const formData = new FormData(form);
      currentJobDesc = formData.get("job_desc");

      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Flask server not reachable");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      currentResumeText = data.original_resume;
      
      const scoreColor = getScoreColor(data.ats_percentage);

      output.innerHTML = `
        <div class="ats-score-card">
          <div class="score-circle" style="border-color: ${scoreColor};">
            <div class="score-value" style="color: ${scoreColor};">${data.ats_percentage}%</div>
            <div class="score-label">ATS Score</div>
          </div>
          <div class="score-details">
            <div class="fit-label" style="color: ${scoreColor};">${data.fit_label}</div>
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span>Semantic Match:</span>
                <span class="breakdown-value">${data.breakdown.semantic_match}%</span>
              </div>
              <div class="breakdown-item">
                <span>Keyword Match:</span>
                <span class="breakdown-value">${data.breakdown.keyword_match}%</span>
              </div>
            </div>
          </div>
        </div>
        
        ${renderAgenticRoadmap(data.ai_roadmap)}
        
        <div style="margin-top: 30px;">
            ${parseAIReport(data.report)}
        </div>
      `;

      if (data.ats_percentage < 85) {
        improvementSection.style.display = "block";
        setTimeout(() => {
          improvementSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }

    } catch (err) {
      output.innerHTML = `
        <div class="ats-score" style="color:#f87171;">
          ❌ Error: ${err.message}
        </div>`;
    }
  });
}


function renderAgenticRoadmap(aiRoadmap) {
  
  const roadmapSections = parseAgenticRoadmap(aiRoadmap);
  
  return `
    <div class="form-card" style="margin-top: 30px; border-top: 4px solid var(--accent);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 style="color:var(--accent); margin:0;">🤖 Agentic Career Architect</h2>
        <span class="chip" style="background:var(--accent); color:white;">AI Generated Plan</span>
      </div>
      
      <div style="background:var(--bg); padding:20px; border-radius:10px; border:1px solid var(--border); margin-bottom:20px;">
          <h4 style="color:var(--text); margin-top:0; display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.3rem;">🧠</span> Strategic Analysis
          </h4>
          <div style="font-size:0.95rem; color:var(--muted); line-height:1.6;">
              ${roadmapSections.analysis || "Analysis pending..."}
          </div>
      </div>

      <h3 style="color:var(--accent); margin-bottom:15px;">🚀 Personalized Learning Roadmap</h3>
      <div class="roadmap-grid">
        
        <div class="roadmap-card">
            <div class="roadmap-header">📅 Phase 1: Core Foundation</div>
            <div class="roadmap-content">
                ${roadmapSections.phase1 || "Focus on fundamentals."}
            </div>
        </div>

        <div class="roadmap-card">
            <div class="roadmap-header">🚀 Phase 2: Advanced Application</div>
            <div class="roadmap-content">
                ${roadmapSections.phase2 || "Build complex projects."}
            </div>
        </div>

        <div class="roadmap-card">
            <div class="roadmap-header">🛠️ Recommended Projects</div>
            <div class="roadmap-content">
                ${roadmapSections.projects || "Build a portfolio project."}
            </div>
        </div>

        <div class="roadmap-card">
            <div class="roadmap-header">📚 Curated Resources</div>
            <div class="roadmap-content">
                ${roadmapSections.resources || "Official Documentation."}
            </div>
        </div>

      </div>
    </div>
  `;
}

function parseAgenticRoadmap(text) {
    if (!text) return {};
    
    const sections = {
        analysis: extractSection(text, "Strategic Analysis"),
        phase1: extractSection(text, "Phase 1"),
        phase2: extractSection(text, "Phase 2"),
        projects: extractSection(text, "Recommended Projects"),
        resources: extractSection(text, "Curated Resources") 
    };

    for (let key in sections) {
        if (sections[key]) {
            sections[key] = sections[key].replace(/- /g, "• ").replace(/\n/g, "<br>");
        }
    }
    return sections;
}

function extractSection(text, headerName) {
    const regex = new RegExp(`##.*?${headerName}[\\s\\S]*?(?=(##|$))`, "i");
    const match = text.match(regex);
    if (match) {
        return match[0].replace(new RegExp(`##.*?${headerName}`, "i"), "").trim();
    }
    return "";
}


const applyAIFixesBtn = document.getElementById("applyAIFixes");
if (applyAIFixesBtn) {
  applyAIFixesBtn.addEventListener("click", async () => {
    const resultsDiv = document.getElementById("improvementResults");
    const improvementSection = document.getElementById("improvementSection");
    
    improvementSection.style.display = "none";
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = `
      <div class="loading-animation">
        <div class="spinner"></div>
        <p>🤖 AI Optimizer Running...</p>
        <p style="font-size: 0.9rem;">Enhancing keywords, formatting, and achievements</p>
        <p style="font-size: 0.8rem; color: var(--muted);">This may take 10-30 seconds...</p>
      </div>
    `;

    try {
      console.log("Sending improvement request...");
      console.log("Resume text length:", currentResumeText.length);
      console.log("Job desc length:", currentJobDesc.length);
      
      const res = await fetch("http://127.0.0.1:5000/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: currentResumeText,
          job_desc: currentJobDesc
        })
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error response:", errorText);
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("Response data:", data);
      
      if (!data.success) {
        throw new Error(data.error || "Optimization failed - no success flag");
      }

      
      if (!data.after_resume_data) {
        throw new Error("No resume data returned from server");
      }

     
      window.improvedResumeData = data.after_resume_data;

      const scoreDelta = data.improvement || 0;
      const deltaColor = scoreDelta > 0 ? "#10b981" : (scoreDelta < 0 ? "#ef4444" : "#f59e0b");
      const deltaIcon = scoreDelta > 0 ? "📈" : (scoreDelta < 0 ? "📉" : "➡️");

      resultsDiv.innerHTML = `
        <div class="form-card" style="margin-top: 30px; border: 2px solid var(--accent);">
          <h3 style="color: var(--accent); margin: 0 0 20px 0;">
            ✅ AI Optimization Complete
          </h3>

          <div class="comparison-grid">
            <div class="comparison-card">
              <div class="comparison-label">Original Score</div>
              <div class="comparison-score" style="color: ${getScoreColor(data.before_score)};">
                ${data.before_score}%
              </div>
              <div style="font-size: 0.9rem; color: var(--muted); margin-top: 8px;">
                ${data.before_fit}
              </div>
            </div>

            <div class="comparison-arrow">→</div>

            <div class="comparison-card highlight">
              <div class="comparison-label">Optimized Score</div>
              <div class="comparison-score" style="color: ${getScoreColor(data.after_score)};">
                ${data.after_score}%
              </div>
              <div style="font-size: 0.9rem; color: var(--muted); margin-top: 8px;">
                ${data.after_fit}
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0; padding: 15px; background: var(--bg); border-radius: 10px; border: 1px solid var(--border);">
            <span style="font-size: 1.5rem; font-weight: 700; color: ${deltaColor};">
              ${deltaIcon} ${scoreDelta > 0 ? '+' : ''}${scoreDelta}% ${scoreDelta >= 0 ? 'Improvement' : 'Change'}
            </span>
          </div>

          <div class="btn-container">
            
            <button onclick="downloadResume('png')" style="flex: 1; background: var(--card); color: var(--text); border: 1px solid var(--border);">
              🖼️ PNG
            </button>
            <button onclick="downloadResumeAsText()" style="flex: 1; background: var(--card); color: var(--text); border: 1px solid var(--border);">
              📝 TXT
            </button>
          </div>
        </div>

        ${data.ai_roadmap ? renderAgenticRoadmap(data.ai_roadmap) : ''}

        <div style="margin-top: 30px;">
          ${data.final_report ? parseAIReport(data.final_report) : '<div class="form-card">Report generation in progress...</div>'}
        </div>
      `;

      resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
      console.error("Optimization error:", err);
      resultsDiv.innerHTML = `
        <div class="form-card" style="border: 2px solid #ef4444;">
          <h3 style="color: #ef4444;">❌ Optimization Failed</h3>
          <p style="color: var(--text); margin: 15px 0;">
            <strong>Error:</strong> ${err.message}
          </p>
          <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="font-size: 0.9rem; color: var(--muted); margin: 0;">
              <strong>Troubleshooting tips:</strong><br>
              • Ensure the Flask server is running (python main.py)<br>
              • Check your Groq API key is valid in the .env file<br>
              • Check the browser console (F12) for detailed errors<br>
              • Try refreshing the page and analyzing again
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="location.reload()" class="secondary" style="flex: 1;">Refresh Page</button>
            <button onclick="document.getElementById('improvementSection').style.display='block'; document.getElementById('improvementResults').style.display='none';" style="flex: 1;">Try Again</button>
          </div>
        </div>
      `;
    }
  });
}


const skipBtn = document.getElementById("skipImprovement");
if (skipBtn) {
  skipBtn.addEventListener("click", () => {
    document.getElementById("improvementSection").style.display = "none";
  });
}


function formatResumeToModernTemplate(data) {
  if (!data || !data.name) {
    return '<div style="padding: 40px; text-align: center;">Resume data unavailable</div>';
  }

  const contactItems = [
    data.contact.phone ? `<span>📞 ${data.contact.phone}</span>` : '',
    data.contact.email ? `<span>✉️ ${data.contact.email}</span>` : '',
    data.contact.location ? `<span>📍 ${data.contact.location}</span>` : ''
  ].filter(Boolean).join(' | ');

  const socialItems = [
    data.contact.linkedin ? `<span>🔗 ${data.contact.linkedin}</span>` : '',
    data.contact.github ? `<span>🐙 ${data.contact.github}</span>` : '',
    data.contact.website ? `<span>🌐 ${data.contact.website}</span>` : ''
  ].filter(Boolean).join(' | ');

  const experienceHTML = data.experience.map(exp => `
    <div class="experience-item" style="margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <strong style="font-size: 12px;">${exp.company}</strong>
        <span style="font-size: 11px; color: #666;">${exp.duration}</span>
      </div>
      <div style="font-size: 11px; font-style: italic; margin-bottom: 5px;">${exp.role}</div>
      <ul style="margin: 5px 0; padding-left: 20px; list-style: disc;">
        ${exp.description.map(desc => `<li style="margin-bottom: 3px; font-size: 11px; line-height: 1.4;">${desc}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const educationHTML = data.education.map(edu => `
    <div style="margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 11px;">${edu.institution}</div>
      <div style="font-size: 11px;">${edu.degree}</div>
      <div style="font-size: 11px; color: #666;">${edu.year}</div>
    </div>
  `).join('');

  
  return `
    <div id="resume-to-download" style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 40px 50px; line-height: 1.4; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">${data.name}</h1>
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 400; color: #333;">${data.title}</h3>
        <div style="font-size: 11px; margin-bottom: 5px;">${contactItems}</div>
        <div style="font-size: 11px;">${socialItems}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px;">
        <div>
          ${data.summary ? `
            <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #000;">Summary</h4>
            <p style="font-size: 11px; line-height: 1.5; margin-bottom: 20px;">${data.summary}</p>
          ` : ''}
          ${data.skills && data.skills.length ? `
            <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #000;">Skills</h4>
            <ul style="margin: 0 0 20px 0; padding-left: 15px;">
              ${data.skills.map(skill => `<li style="margin-bottom: 5px; font-size: 11px;">${skill}</li>`).join('')}
            </ul>
          ` : ''}
          ${educationHTML ? `
            <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #000;">Education</h4>
            <div style="margin-bottom: 20px;">${educationHTML}</div>
          ` : ''}
        </div>
        <div>
          <h4 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px; color: #000; padding-bottom: 5px; border-bottom: 1px solid #e0e0e0;">Work Experience</h4>
          ${experienceHTML}
        </div>
      </div>
    </div>
  `;
}


async function downloadResume(type) {
  if (!window.improvedResumeData) {
    alert("No improved resume data available. Please run the optimizer first.");
    return;
  }

  console.log(`Starting ${type.toUpperCase()} download...`);
  
 
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'download-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--card);
    padding: 30px 50px;
    border-radius: 12px;
    z-index: 10000;
    border: 2px solid var(--accent);
    text-align: center;
  `;
  loadingDiv.innerHTML = `
    <div class="spinner" style="margin: 0 auto 15px;"></div>
    <p style="color: var(--text); margin: 0; font-size: 1.1rem;">Generating ${type.toUpperCase()}...</p>
    <p style="color: var(--muted); font-size: 0.9rem; margin: 10px 0 0 0;">Please wait...</p>
  `;
  document.body.appendChild(loadingDiv);

  try {
    
    const resumeHTML = createResumeHTML(window.improvedResumeData);
    
    if (type === 'pdf') {
      await downloadAsPDF(resumeHTML);
    } else if (type === 'png') {
      await downloadAsPNG(resumeHTML);
    }
    
    
    setTimeout(() => {
      const loader = document.getElementById('download-loading');
      if (loader && loader.parentNode) {
        document.body.removeChild(loader);
      }
    }, 1500);
    
  } catch (error) {
    console.error(`Download error:`, error);
    
    
    const loader = document.getElementById('download-loading');
    if (loader && loader.parentNode) {
      document.body.removeChild(loader);
    }
    
    
    showDownloadError(type, error.message);
  }
}


function createResumeHTML(data) {
  const contactItems = [
    data.contact.phone ? data.contact.phone : '',
    data.contact.email ? data.contact.email : '',
    data.contact.location ? data.contact.location : ''
  ].filter(Boolean).join(' | ');

  const socialItems = [
    data.contact.linkedin ? data.contact.linkedin : '',
    data.contact.github ? data.contact.github : '',
    data.contact.website ? data.contact.website : ''
  ].filter(Boolean).join(' | ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.6;
          color: #000;
          background: #fff;
          padding: 40px 50px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          font-size: 28px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 16px;
          font-weight: 400;
          color: #333;
          margin-bottom: 15px;
        }
        h3 {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          margin: 20px 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #e0e0e0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .contact {
          font-size: 11px;
          margin: 5px 0;
        }
        .content {
          font-size: 11px;
        }
        .section {
          margin-bottom: 20px;
        }
        ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 3px;
        }
        .experience-item {
          margin-bottom: 15px;
        }
        .exp-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .exp-role {
          font-style: italic;
          margin-bottom: 5px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .skill {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.name || 'Resume'}</h1>
        <h2>${data.title || ''}</h2>
        <div class="contact">${contactItems}</div>
        ${socialItems ? `<div class="contact">${socialItems}</div>` : ''}
      </div>
      
      <div class="content">
        ${data.summary ? `
          <div class="section">
            <h3>Professional Summary</h3>
            <p>${data.summary}</p>
          </div>
        ` : ''}
        
        ${data.skills && data.skills.length ? `
          <div class="section">
            <h3>Skills</h3>
            <div class="skills">
              ${data.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        
        ${data.experience && data.experience.length ? `
          <div class="section">
            <h3>Work Experience</h3>
            ${data.experience.map(exp => `
              <div class="experience-item">
                <div class="exp-header">
                  <span>${exp.company}</span>
                  <span>${exp.duration}</span>
                </div>
                <div class="exp-role">${exp.role}</div>
                <ul>
                  ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${data.education && data.education.length ? `
          <div class="section">
            <h3>Education</h3>
            ${data.education.map(edu => `
              <div style="margin-bottom: 10px;">
                <div style="font-weight: bold;">${edu.institution}</div>
                <div>${edu.degree}</div>
                <div style="color: #666;">${edu.year}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}


async function downloadAsPDF(htmlContent) {
  if (typeof html2pdf === 'undefined') {
    throw new Error('PDF library not loaded. Please refresh the page.');
  }
  
  console.log('Creating PDF container...');
  
  
  const container = document.createElement('div');
  container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 210mm; background: white;';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    const element = container.querySelector('body') || container;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'Optimized_Resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    console.log('Generating PDF with html2pdf...');
    await html2pdf().set(opt).from(element).save();
    console.log('PDF generated successfully');
    
  } finally {
    
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}


async function downloadAsPNG(htmlContent) {
  if (typeof html2canvas === 'undefined') {
    throw new Error('PNG library not loaded. Please refresh the page.');
  }
  
  console.log('Creating PNG container...');
  
  
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; height: 1200px; border: none;';
  document.body.appendChild(iframe);
  
  try {
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    
    const element = iframeDoc.body;
    
    if (!element) {
      throw new Error('Failed to render content');
    }
    
    console.log('Rendering to canvas...');
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 800,
      height: element.scrollHeight,
      windowWidth: 800,
      windowHeight: element.scrollHeight
    });
    
    console.log(`Canvas created: ${canvas.width}x${canvas.height}`);
    
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image'));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'Optimized_Resume.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      }, 'image/png', 1.0);
    });
    
  } finally {
    
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}


function showDownloadError(type, errorMsg) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--card);
    padding: 30px;
    border-radius: 12px;
    z-index: 10001;
    border: 2px solid #ef4444;
    max-width: 500px;
  `;
  
  errorDiv.innerHTML = `
    <h3 style="color: #ef4444; margin: 0 0 15px 0;">❌ Failed to generate ${type.toUpperCase()}</h3>
    <p style="color: var(--text); margin-bottom: 15px; font-size: 0.95rem;">
      <strong>Error:</strong> ${errorMsg}
    </p>
    <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="color: var(--muted); font-size: 0.9rem; margin: 0 0 10px 0;"><strong>Try these solutions:</strong></p>
      <ul style="color: var(--muted); font-size: 0.85rem; margin: 0; padding-left: 20px;">
        <li>Refresh the page and try again</li>
        <li>Try the ${type === 'pdf' ? 'PNG' : 'PDF'} format instead</li>
        <li>Use the TXT download option</li>
        <li>Try a different browser (Chrome works best)</li>
      </ul>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="location.reload()" style="flex: 1; padding: 10px; background: var(--accent); color: white; border: none; border-radius: 8px; cursor: pointer;">
        Refresh Page
      </button>
      <button onclick="downloadResumeAsText()" style="flex: 1; padding: 10px; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">
        Download as TXT
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="flex: 0.5; padding: 10px; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 8px; cursor: pointer;">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
}


function generateResumeTextVersion(data) {
  let text = '';
  
  text += `${data.name}\n`;
  text += `${data.title}\n`;
  text += `\n`;
  
  
  if (data.contact.phone) text += `Phone: ${data.contact.phone}\n`;
  if (data.contact.email) text += `Email: ${data.contact.email}\n`;
  if (data.contact.location) text += `Location: ${data.contact.location}\n`;
  if (data.contact.linkedin) text += `LinkedIn: ${data.contact.linkedin}\n`;
  if (data.contact.github) text += `GitHub: ${data.contact.github}\n`;
  if (data.contact.website) text += `Website: ${data.contact.website}\n`;
  text += `\n`;
  
  
  if (data.summary) {
    text += `PROFESSIONAL SUMMARY\n`;
    text += `${data.summary}\n\n`;
  }
  
  
  if (data.skills && data.skills.length) {
    text += `SKILLS\n`;
    text += data.skills.join(', ') + '\n\n';
  }
  
  
  if (data.experience && data.experience.length) {
    text += `WORK EXPERIENCE\n`;
    data.experience.forEach(exp => {
      text += `\n${exp.company} | ${exp.role}\n`;
      text += `${exp.duration}\n`;
      exp.description.forEach(desc => {
        text += `• ${desc}\n`;
      });
    });
    text += `\n`;
  }
  
  
  if (data.education && data.education.length) {
    text += `EDUCATION\n`;
    data.education.forEach(edu => {
      text += `${edu.institution} | ${edu.degree} | ${edu.year}\n`;
    });
  }
  
  return text;
}


function downloadResumeAsText() {
  if (!window.improvedResumeData) {
    alert("No improved resume data available. Please run the optimizer first.");
    return;
  }
  
  try {
    const text = generateResumeTextVersion(window.improvedResumeData);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'Optimized_Resume.txt';
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Text file download complete');
  } catch (error) {
    console.error('Text download error:', error);
    alert('Failed to download text file. Error: ' + error.message);
  }
}


function parseAIReport(report) {
  if (!report) return '<div class="form-card">No report available.</div>';

 
  const sections = report.split(/^##\s+/gm).slice(1);
  
  let html = '<div class="report-container">';

  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    let icon = '📄';
    let headerClass = 'report-header';
    
    if (title.includes('ATS COMPATIBILITY')) { icon = '🎯'; headerClass += ' header-ats'; }
    else if (title.includes('STRENGTHS')) { icon = '💪'; headerClass += ' header-strengths'; }
    else if (title.includes('CRITICAL ISSUES') || title.includes('GAPS')) { icon = '🚨'; headerClass += ' header-missing'; }
    else if (title.includes('OPTIMIZATION') || title.includes('RECOMMENDATIONS')) { icon = '💡'; headerClass += ' header-tips'; }

    html += `
      <div class="report-card">
        <h3 class="${headerClass}">
          <span class="report-icon">${icon}</span> ${title}
        </h3>
        <div class="report-body">
          ${formatReportContent(content)}
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function formatReportContent(content) {
  
  if (content.startsWith('Overall Match:')) {
    const matchLine = content.split('\n')[0];
    const rest = content.substring(matchLine.length).trim();
    const stars = matchLine.match(/(\d)\/5/);
    let starHtml = '';
    if (stars) {
      const count = parseInt(stars[1]);
      starHtml = '<span style="color: #fbbf24;">' + '★'.repeat(count) + '☆'.repeat(5 - count) + '</span>';
    }
    return `
      <div style="margin-bottom: 15px; font-size: 1.1rem; font-weight: 600;">
        ${matchLine.replace(stars ? stars[0] : '', starHtml)}
      </div>
      ${formatReportContent(rest)}
    `;
  }

  
  const subsectionPattern = /^###\s+(.+)/gm;
  let processedContent = content;
  
  
  processedContent = processedContent.replace(subsectionPattern, (match, title) => {
    let subsectionIcon = '▸';
    let subsectionColor = 'var(--accent)';
    
    if (title.includes('Missing Skills')) { subsectionIcon = '⚠️'; subsectionColor = '#ef4444'; }
    else if (title.includes('Formatting')) { subsectionIcon = '📋'; subsectionColor = '#f59e0b'; }
    else if (title.includes('Keyword')) { subsectionIcon = '🔑'; subsectionColor = '#3b82f6'; }
    
    return `<div style="margin: 20px 0 12px 0; padding: 8px 12px; background: var(--bg); border-left: 3px solid ${subsectionColor}; border-radius: 4px;">
      <strong style="color: ${subsectionColor}; font-size: 1.05rem;">
        ${subsectionIcon} ${title}
      </strong>
    </div>`;
  });

  
  return processedContent.split('\n').map(line => {
    line = line.trim();
    if (!line || line.startsWith('<div')) return line;
    
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
        const number = numberedMatch[1];
        let text = numberedMatch[2];
        
        text = text.replace(/^(.*?)(\s*-\s*|$)/, '<strong>$1</strong>$2');
        return `
        <div class="report-list-item">
            <span class="item-number">${number}</span>
            <span class="item-text">${text}</span>
        </div>
        `;
    }
    return `<p class="report-text">${line}</p>`;
  }).join('');
}

function getScoreColor(score) {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#34d399";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}