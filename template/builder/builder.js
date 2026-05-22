document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const downloadTxtBtn = document.getElementById("downloadTxtBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const resumeContainer = document.getElementById("resumeContainer");
  const templateSelector = document.getElementById("templateSelector");

  generateBtn.addEventListener("click", () => {
   
    const name = val("name").toUpperCase();
    const title = val("title");
    const phone = val("phone");
    const email = val("email");
    const address = val("address");
    const github = val("github");
    const linkedin = val("linkedin");
    const website = val("website");
    const summary = val("summary");

    const skills = splitList("skills");
    const softSkills = splitList("softSkills");
    const additionalSkills = splitList("additionalSkills");
    const experience = splitLines("experience");
    const education = splitLines("education");
    const certifications = splitLines("certifications");
    const languages = splitList("languages");
    const hobbies = splitList("hobbies");

    
    if (!name || !phone || !email) {
      alert("Please enter at least your Name, Phone, and Email.");
      return;
    }

    
    const selectedTemplate = templateSelector.value;

    
    let html = "";
    
    if (selectedTemplate === "modern") {
      html = generateModernTemplate({
        name, title, phone, email, address, github, linkedin, website,
        summary, skills, softSkills, additionalSkills, experience, 
        education, certifications, languages, hobbies
      });
    } else if (selectedTemplate === "santiago") {
      html = generateSantiagoTemplate({
        name, title, phone, email, address, github, linkedin, website,
        summary, skills, softSkills, additionalSkills, experience, 
        education, certifications, languages, hobbies
      });
    } else if (selectedTemplate === "classic") {
      html = generateClassicTemplate({
        name, title, phone, email, address, github, linkedin, website,
        summary, skills, softSkills, additionalSkills, experience, 
        education, certifications, languages, hobbies
      });
    }

    resumeContainer.innerHTML = html;

    
    downloadTxtBtn.style.display = "inline-block";
    downloadPdfBtn.style.display = "inline-block";

    
    window.atsText = generateATSText({
      name, title, phone, email, address, github, linkedin, website,
      summary, skills, softSkills, additionalSkills, experience, 
      education, certifications, languages, hobbies
    });
  });

  
  downloadTxtBtn.addEventListener("click", () => {
    const blob = new Blob([window.atsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${val("name")}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  
  downloadPdfBtn.addEventListener("click", () => {
    const element = document.getElementById("resumePDF");
    const opt = {
      margin: 0,
      filename: `${val("name")}_ATS_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  });

 

  function generateModernTemplate(data) {
   
    let contactItems = [
      `<span>📞 ${data.phone}</span>`,
      `<span>✉️ ${data.email}</span>`,
      data.address ? `<span>📍 ${data.address}</span>` : ''
    ];

    let socialItems = [
      data.github ? `<span>🔗 ${data.github}</span>` : '',
      data.linkedin ? `<span>🔗 ${data.linkedin}</span>` : '',
      data.website ? `<span>🔗 ${data.website}</span>` : ''
    ];

    contactItems = contactItems.filter(i => i).join('');
    socialItems = socialItems.filter(i => i).join('');

   
    const experienceItems = parseExperienceEntries(data.experience);

    return `
    <div class="resume modern" id="resumePDF">
      <!-- Header Section -->
      <div class="resume-header">
        <h1>${data.name}</h1>
        <h3>${data.title}</h3>
        <div class="contact-line">
          ${contactItems}
        </div>
        ${socialItems ? `<div class="contact-line">${socialItems}</div>` : ''}
      </div>

      <!-- Two Column Body -->
      <div class="resume-body">
        <!-- LEFT COLUMN -->
        <div class="left-column">
          ${data.summary ? `
            <h4>Summary</h4>
            <p>${data.summary}</p>
          ` : ''}

          ${data.education.length > 0 ? `
            <h4>Education</h4>
            ${data.education.map(ed => `<p>${ed}</p>`).join('')}
          ` : ''}

          ${data.skills.length > 0 ? `
            <h4>Technical Skills</h4>
            <ul>${data.skills.map(s => `<li>${s}</li>`).join('')}</ul>
          ` : ''}

          ${data.softSkills.length > 0 ? `
            <h4>Soft Skills</h4>
            <ul>${data.softSkills.map(s => `<li>${s}</li>`).join('')}</ul>
          ` : ''}

          ${data.additionalSkills.length > 0 ? `
            <h4>Additional Skills</h4>
            <ul>${data.additionalSkills.map(s => `<li>${s}</li>`).join('')}</ul>
          ` : ''}

          ${data.languages.length > 0 ? `
            <h4>Languages</h4>
            <ul>${data.languages.map(l => `<li>${l}</li>`).join('')}</ul>
          ` : ''}

          ${data.certifications.length > 0 ? `
            <h4>Certifications</h4>
            ${data.certifications.map(c => `<p>${c}</p>`).join('')}
          ` : ''}
        </div>

        <!-- RIGHT COLUMN -->
        <div class="right-column">
          ${data.experience.length > 0 ? `
            <h4>Work Experience</h4>
            ${experienceItems}
          ` : ''}

          ${data.hobbies.length > 0 ? `
            <h4>Interests</h4>
            <ul>${data.hobbies.map(h => `<li>${h}</li>`).join('')}</ul>
          ` : ''}
        </div>
      </div>
    </div>
    `;
  }

  function generateSantiagoTemplate(data) {
    return `
    <div class="resume santiago" id="resumePDF">
      <!-- LEFT SIDEBAR -->
      <div class="resume-sidebar">
        <h1>${data.name}</h1>
        <h3>${data.title}</h3>
        
        <div class="contact-info">
          <p><strong>Phone:</strong><br>${data.phone}</p>
          <p><strong>Email:</strong><br>${data.email}</p>
          ${data.address ? `<p><strong>Location:</strong><br>${data.address}</p>` : ''}
          ${data.github ? `<p><strong>GitHub:</strong><br>${data.github}</p>` : ''}
          ${data.linkedin ? `<p><strong>LinkedIn:</strong><br>${data.linkedin}</p>` : ''}
          ${data.website ? `<p><strong>Website:</strong><br>${data.website}</p>` : ''}
        </div>

        ${data.skills.length > 0 ? `
          <h4>SKILLS</h4>
          <ul>${data.skills.map(s => `<li>${s}</li>`).join('')}</ul>
        ` : ''}

        ${data.languages.length > 0 ? `
          <h4>LANGUAGES</h4>
          <ul>${data.languages.map(l => `<li>${l}</li>`).join('')}</ul>
        ` : ''}

        ${data.hobbies.length > 0 ? `
          <h4>INTERESTS</h4>
          <ul>${data.hobbies.map(h => `<li>${h}</li>`).join('')}</ul>
        ` : ''}
      </div>

      <!-- RIGHT CONTENT AREA -->
      <div class="resume-content">
        ${data.summary ? `
          <h4>PROFESSIONAL SUMMARY</h4>
          <p>${data.summary}</p>
        ` : ''}

        ${data.experience.length > 0 ? `
          <h4>WORK EXPERIENCE</h4>
          <ul>${data.experience.map(e => `<li>${e}</li>`).join('')}</ul>
        ` : ''}

        ${data.education.length > 0 ? `
          <h4>EDUCATION</h4>
          <ul>${data.education.map(ed => `<li>${ed}</li>`).join('')}</ul>
        ` : ''}

        ${data.certifications.length > 0 ? `
          <h4>CERTIFICATIONS</h4>
          <ul>${data.certifications.map(c => `<li>${c}</li>`).join('')}</ul>
        ` : ''}
      </div>
    </div>
    `;
  }

  function generateClassicTemplate(data) {
    return `
    <div class="resume classic" id="resumePDF">
      <div class="resume-header">
        <h1>${data.name}</h1>
        <h3>${data.title}</h3>
        <p>${data.phone} | ${data.email} | ${data.address}</p>
      </div>

      ${data.summary ? `
        <h4>PROFESSIONAL SUMMARY</h4>
        <p>${data.summary}</p>
      ` : ''}

      ${data.experience.length > 0 ? `
        <h4>WORK EXPERIENCE</h4>
        <ul>${data.experience.map(e => `<li>${e}</li>`).join('')}</ul>
      ` : ''}

      ${data.education.length > 0 ? `
        <h4>EDUCATION</h4>
        <ul>${data.education.map(ed => `<li>${ed}</li>`).join('')}</ul>
      ` : ''}

      ${data.skills.length > 0 ? `
        <h4>SKILLS</h4>
        <p>${data.skills.join(', ')}</p>
      ` : ''}

      ${data.certifications.length > 0 ? `
        <h4>CERTIFICATIONS</h4>
        <ul>${data.certifications.map(c => `<li>${c}</li>`).join('')}</ul>
      ` : ''}
    </div>
    `;
  }

  

  function parseExperienceEntries(experienceArray) {
    
    
    return experienceArray.map(entry => {
      const lines = entry.split('\n').filter(l => l.trim());
      
      if (lines.length === 0) return '';

      
      const firstLine = lines[0];
      const parts = firstLine.split('|').map(p => p.trim());
      
      let companyName = parts[0] || '';
      let jobTitle = parts[1] || '';
      let dateRange = parts[2] || '';

      
      if (parts.length === 1) {
        
        companyName = firstLine;
        jobTitle = lines[1] || '';
        dateRange = '';
      }

      const description = lines.slice(1).join('<br>');

      return `
        <div class="experience-item">
          <div class="experience-header">
            <h5>${companyName}</h5>
            ${dateRange ? `<span class="date">${dateRange}</span>` : ''}
          </div>
          ${jobTitle ? `<div class="experience-title">${jobTitle}</div>` : ''}
          ${description ? `<div class="experience-description">${description}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function val(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function splitList(id) {
    return val(id).split(",").map(v => v.trim()).filter(v => v);
  }

  function splitLines(id) {
    return val(id).split("\n").map(v => v.trim()).filter(v => v);
  }

  function generateATSText(d) {
    return `
${d.name}
${d.title}
${d.phone} | ${d.email} | ${d.address}
${d.github ? 'GitHub: ' + d.github : ''}
${d.linkedin ? 'LinkedIn: ' + d.linkedin : ''}
${d.website ? 'Website: ' + d.website : ''}

SUMMARY
${d.summary}

TECHNICAL SKILLS
${d.skills.join(", ")}

SOFT SKILLS
${d.softSkills.join(", ")}

ADDITIONAL SKILLS
${d.additionalSkills.join(", ")}

EXPERIENCE
${d.experience.join("\n\n")}

EDUCATION
${d.education.join("\n")}

CERTIFICATIONS
${d.certifications.join("\n")}

LANGUAGES
${d.languages.join(", ")}

INTERESTS
${d.hobbies.join(", ")}
`.trim();
  }
});