exports.id=558,exports.ids=[558],exports.modules={5276:()=>{},2124:()=>{},3710:(e,t,r)=>{"use strict";r.d(t,{TS:()=>d,Xv:()=>c,YE:()=>u,qK:()=>p,qt:()=>l,rm:()=>a});var s=r(434),o=r(7258);let i=new s.Ay({apiKey:process.env.OPENAI_API_KEY}),n="gpt-4-1106-preview";async function a(e,t,r){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Parsing job description with GPT-4.1...");let s=`
      You are an expert job description analyzer. Parse the following job description into a structured format.
      Extract the following information:
      - Job title
      - Company name (if available)
      - Required skills (technical and soft skills explicitly mentioned as requirements)
      - Preferred skills (skills mentioned as "nice to have" or "preferred")
      - Key responsibilities
      - Qualifications (education, experience, certifications)
      - Company values (if mentioned)
      
      Format your response as a valid JSON object with these fields. If any field is not found, return an empty array or null.
      
      Job Description:
      ${e}
    `,a=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert job description analyzer that extracts structured information."},{role:"user",content:s}],temperature:.1,response_format:{type:"json_object"}});a.usage&&await (0,o.st)(t,r||null,"parseJobDescription",a.usage.prompt_tokens,a.usage.completion_tokens);let l=a.choices[0]?.message?.content||"{}",c=JSON.parse(l);return{jobTitle:c.jobTitle||"Unknown Position",company:c.company||"Unknown Company",requiredSkills:c.requiredSkills||[],preferredSkills:c.preferredSkills||[],responsibilities:c.responsibilities||[],qualifications:c.qualifications||[],companyValues:c.companyValues||[]}}catch(e){throw console.error("Error parsing job description:",e),e}}async function l(e,t,r,s=10){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Generating interview questions with GPT-4.1...");let a=`
      You are an expert technical interviewer. Generate ${s} interview questions for a ${e.jobTitle} position at ${e.company}.
      
      Job details:
      - Required skills: ${e.requiredSkills.join(", ")}
      - Preferred skills: ${e.preferredSkills.join(", ")}
      - Responsibilities: ${e.responsibilities.join(", ")}
      - Qualifications: ${e.qualifications.join(", ")}
      
      Create a mix of:
      - Technical questions that assess the required skills
      - Behavioral questions that evaluate soft skills and cultural fit
      - Situational questions that test problem-solving abilities
      
      For each question, include:
      - A unique ID (q1, q2, etc.)
      - The question text
      - Type (technical, behavioral, or situational)
      - The primary skill being assessed
      - Difficulty level (easy, medium, or hard)
      
      Format your response as a valid JSON array of question objects.
    `,l=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert technical interviewer that creates relevant and challenging interview questions."},{role:"user",content:a}],temperature:.7,response_format:{type:"json_object"}});l.usage&&await (0,o.st)(t,r||null,"generateInterviewQuestions",l.usage.prompt_tokens,l.usage.completion_tokens);let c=l.choices[0]?.message?.content||'{"questions":[]}';return(JSON.parse(c).questions||[]).map((e,t)=>({id:e.id||`q${t+1}`,text:e.text,type:e.type||"technical",skill:e.skill,difficulty:e.difficulty||"medium"}))}catch(e){throw console.error("Error generating interview questions:",e),e}}async function c(e,t,r,s,a){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Analyzing answer with GPT-4.1...");let l=`
      You are an expert interview evaluator. Analyze the following candidate answer to an interview question.
      
      Job Position: ${r.jobTitle}
      Required Skills: ${r.requiredSkills.join(", ")}
      
      Question (${e.type}, testing ${e.skill}): ${e.text}
      
      Candidate Answer: ${t}
      
      Provide an analysis with:
      1. Strengths (what the candidate did well)
      2. Weaknesses (what could be improved)
      3. Missing competencies (specific skills or knowledge areas that weren't demonstrated)
      4. Score (1-10 scale, where 10 is excellent)
      5. Whether a follow-up question is needed (true/false)
      
      Format your response as a valid JSON object.
    `,c=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert interview evaluator that provides detailed and constructive feedback."},{role:"user",content:l}],temperature:.3,response_format:{type:"json_object"}});c.usage&&await (0,o.st)(s,a||null,"analyzeAnswer",c.usage.prompt_tokens,c.usage.completion_tokens);let u=c.choices[0]?.message?.content||"{}",d=JSON.parse(u);return{strengths:d.strengths||[],weaknesses:d.weaknesses||[],missingCompetencies:d.missingCompetencies||[],score:d.score||5,needsFollowUp:d.needsFollowUp||!1}}catch(e){throw console.error("Error analyzing answer:",e),e}}async function u(e,t,r,s,a){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Generating follow-up question with GPT-4.1...");let l=`
      You are an expert technical interviewer. Generate a follow-up question based on a candidate's answer.
      
      Original Question: ${e.text}
      Skill Being Tested: ${e.skill}
      
      Candidate Answer: ${t}
      
      Analysis:
      - Strengths: ${r.strengths.join(", ")}
      - Weaknesses: ${r.weaknesses.join(", ")}
      - Missing Competencies: ${r.missingCompetencies.join(", ")}
      
      Create a follow-up question that:
      1. Probes deeper into one of the missing competencies
      2. Gives the candidate a chance to demonstrate knowledge they didn't show
      3. Is specific and targeted (not general)
      4. Maintains a professional and supportive tone
      
      Return only the follow-up question text, without any additional explanation.
    `,c=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert technical interviewer that creates targeted follow-up questions."},{role:"user",content:l}],temperature:.5});return c.usage&&await (0,o.st)(s,a||null,"generateFollowUpQuestion",c.usage.prompt_tokens,c.usage.completion_tokens),c.choices[0]?.message?.content||"Could you elaborate more on your experience with this specific area?"}catch(e){throw console.error("Error generating follow-up question:",e),e}}async function d(e,t,r,s,a,l){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Generating feedback report with GPT-4.1...");let c=Object.keys(r),u=c.reduce((e,t)=>e+(s[t]?.score||0),0),d=c.length>0?u/c.length:0,p=c.map(e=>{let o=t.find(t=>t.id===e);return{question:o?.text||"",type:o?.type||"",skill:o?.skill||"",answer:r[e]||"",analysis:s[e]||{strengths:[],weaknesses:[],score:0}}}),m=`
      You are an expert interview coach. Generate a comprehensive feedback report for a candidate interview.
      
      Job Position: ${e.jobTitle}
      Company: ${e.company}
      Required Skills: ${e.requiredSkills.join(", ")}
      
      Interview Performance:
      ${JSON.stringify(p,null,2)}
      
      Overall Score: ${d.toFixed(1)} / 10
      
      Create a detailed feedback report with:
      1. A summary of overall performance
      2. Key strengths demonstrated across all answers
      3. Areas for improvement
      4. Question-by-question feedback with SOAR method recommendations
      5. Specific next steps for the candidate
      
      Format your response as a valid JSON object with these sections.
      For the SOAR method recommendations, use this format:
      Situation: Choose a specific example that demonstrates expertise
      Task: Define what needed to be accomplished
      Action: Detail steps taken, focusing on personal contribution
      Result: Quantify positive outcomes
    `,h=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert interview coach that provides detailed and constructive feedback."},{role:"user",content:m}],temperature:.4,response_format:{type:"json_object"}});h.usage&&await (0,o.st)(a,l||null,"generateFeedbackReport",h.usage.prompt_tokens,h.usage.completion_tokens);let w=h.choices[0]?.message?.content||"{}",g=JSON.parse(w);return{overallScore:d,summary:g.summary||`Overall performance score: ${d.toFixed(1)}/10`,strengths:g.strengths||[],areasForImprovement:g.areasForImprovement||[],questionFeedback:g.questionFeedback||[],nextSteps:g.nextSteps||[]}}catch(e){throw console.error("Error generating feedback report:",e),e}}async function p(e,t,r,s,a){try{if(!await (0,o.Wh)())throw Error("API calls are currently disabled due to usage limits");console.log("Detecting danger zones with GPT-4.1...");let l=`
      You are an expert interview evaluator. Identify "danger zones" in the following candidate answer.
      
      Danger zones are critical missing elements that would raise red flags for interviewers, such as:
      - Missing technical knowledge that's essential for the role
      - Lack of experience with key technologies mentioned in the job description
      - Absence of important soft skills required for the position
      - Failure to demonstrate problem-solving approach
      - Missing context or specificity in examples
      
      Job Position: ${r.jobTitle}
      Required Skills: ${r.requiredSkills.join(", ")}
      
      Question (${e.type}, testing ${e.skill}): ${e.text}
      
      Candidate Answer: ${t}
      
      List only the specific danger zones detected, with no additional explanation.
      Format your response as a valid JSON array of strings.
    `,c=await i.chat.completions.create({model:n,messages:[{role:"system",content:"You are an expert interview evaluator that identifies critical gaps in candidate answers."},{role:"user",content:l}],temperature:.3,response_format:{type:"json_object"}});c.usage&&await (0,o.st)(s,a||null,"detectDangerZones",c.usage.prompt_tokens,c.usage.completion_tokens);let u=c.choices[0]?.message?.content||'{"dangerZones":[]}';return JSON.parse(u).dangerZones||[]}catch(e){throw console.error("Error detecting danger zones:",e),e}}},7258:(e,t,r)=>{"use strict";r.d(t,{$A:()=>p,GP:()=>g,HW:()=>l,Ij:()=>u,Kh:()=>d,Tt:()=>c,Wh:()=>w,st:()=>h,supabaseAdmin:()=>a,t9:()=>m});var s=r(1028);let o="https://snhezroznzsjcqqxpjpp.supabase.co",i=(0,s.UU)(o,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuaGV6cm96bnpzamNxcXhwanBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTM0NDcsImV4cCI6MjA2MTI2OTQ0N30.KyySx7uxtC_GRB_NF9DYCA9N350ajZ1uQ6hvYDkHiLY"),n=process.env.SUPABASE_SERVICE_ROLE_KEY||"your-service-key",a=(0,s.UU)(o,n);async function l(){try{let{data:e,error:t}=await i.auth.getUser();if(t)throw t;return e.user}catch(e){return console.error("Error getting current user:",e),null}}async function c(e,t,r,s,o,i){try{let{data:n,error:l}=await a.from("job_descriptions").insert({user_id:e,title:t,company:r,content:s,parsed_data:o,file_name:i?.fileName,file_type:i?.fileType,file_size:i?.fileSize,storage_path:i?.storagePath}).select().single();if(l)throw l;return n}catch(e){return console.error("Error storing job description:",e),null}}async function u(e,t,r){try{let{data:s,error:o}=await a.rpc("check_session_limits",{user_uuid:e});if(o)throw o;if(!s.allowed)throw Error("Daily session limit reached");let{data:i,error:n}=await a.from("interview_sessions").insert({user_id:e,job_description_id:t,status:"in_progress",questions:r,answers:{},analyses:{}}).select().single();if(n)throw n;return await a.rpc("increment_session_count",{user_uuid:e}),i}catch(e){return console.error("Error creating interview session:",e),null}}async function d(e,t,r,s){try{let{data:o,error:i}=await a.from("interview_sessions").select("answers, analyses").eq("id",e).single();if(i)throw i;let n={...o.answers,[t]:r},l={...o.analyses,[t]:s},{data:c,error:u}=await a.from("interview_sessions").update({answers:n,analyses:l}).eq("id",e).select().single();if(u)throw u;return c}catch(e){return console.error("Error updating session answer:",e),null}}async function p(e){try{let{data:t,error:r}=await a.from("interview_sessions").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",e).select().single();if(r)throw r;return t}catch(e){return console.error("Error completing interview session:",e),null}}async function m(e,t,r,s,o){try{let{data:i,error:n}=await a.from("feedback_reports").insert({session_id:e,user_id:t,report_data:r,overall_score:s,pdf_path:o}).select().single();if(n)throw n;return i}catch(e){return console.error("Error storing feedback report:",e),null}}async function h(e,t,r,s,o){try{let i=1e-5*s,n=3e-5*o,{data:l,error:c}=await a.from("token_usage").insert({user_id:e,session_id:t,endpoint:r,prompt_tokens:s,completion_tokens:o,total_tokens:s+o,cost:i+n}).select().single();if(c)throw c;let{data:u,error:d}=await a.rpc("check_token_limit");if(d)throw d;return u&&u.limit_reached&&await a.from("global_settings").update({value:"false"}).eq("key","ALLOW_OPENAI_CALLS"),l}catch(e){return console.error("Error tracking token usage:",e),null}}async function w(){try{let{data:e,error:t}=await a.from("global_settings").select("value").eq("key","ALLOW_OPENAI_CALLS").single();if(t)throw t;return"true"===e.value}catch(e){return console.error("Error checking circuit breaker:",e),!1}}async function g(e,t,r){try{let{data:s,error:o}=await a.storage.from(e).upload(t,r,{contentType:"application/pdf",cacheControl:"3600",upsert:!1});if(o)throw o;let{data:i}=a.storage.from(e).getPublicUrl(s.path);return i.publicUrl}catch(e){return console.error("Error uploading PDF:",e),null}}}};