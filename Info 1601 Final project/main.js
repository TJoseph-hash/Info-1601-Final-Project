require('dotenv').config(); 
const express = require('express');
const multer = require('multer'); 
const fs = require('fs'); 
const pdfParse = require('pdf-parse'); 
import axios from axios;
const axios = require('axios'); 

const app = express();
const upload = multer({ dest: 'uploads/' }); 

app.use(express.json());

async function analyzeResume( text, jobDescription){
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an expert in resume analysis." },
                    { role: "user", content: `Analyze this resume:\n${text}\n\nMatch it with this job description:\n${jobDescription}\n\nProvide a match percentage and suggested improvements.` }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error analyzing resume:", error);
        return "Error analyzing resume. Please try again later.";
    }
}

// Resume Upload & Processing
app.post('/upload', upload.single('resume'), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    
    // Validate file type (only PDFs allowed)
    if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).send("Invalid file format. Please upload a PDF.");
    }

    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(fileBuffer);

        const jobDescription = req.body.jobDescription || "Software Engineer with React and Node.js experience.";
        const analysis = await analyzeResume(pdfData.text, jobDescription);

        // Delete file after processing
        fs.unlinkSync(req.file.path);

        res.json({ analysis });
    } catch (error) {
        console.error("Error processing resume:", error);
        res.status(500).send("Error processing resume.");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));

async function uploadResume() { 
    const file = document.getElementById('resume').files[0]; 
    const jobDescription = document.getElementById('jobDescription').value; 
    if (!file) {
        return alert("Please select a resume file."); 
    }
    analyzeResume(file,jobDescription);

    let formData = new FormData(); 
    formData.append("resume", file); 
    formData.append("jobDescription", jobDescription); 

    const response = await fetch("http://localhost:5000/upload", { 
        method: "POST", 
        body: formData 
    }); 

    const data = await response.json(); 
    document.getElementById("result").textContent = data.analysis; 
} 