import assert from 'node:assert/strict';
import {emptyResume, parseResumeBuilderDraft, resumeEssentialCount, resumePlainText, createFactBasedEnglishDraft, hasWritingPlaceholder} from '../src/lib/resumeBuilderData.ts';
import {summarizeResumeBuilderDraft} from '../src/lib/resumeBuilderDraftSummary.ts';
import {createResumeBuilderStorageStatusController} from '../src/lib/resumeBuilderStorage.ts';
let passed=0;
function check(name, fn) { fn(); console.log(`PASS ${++passed}: ${name}`); }
const encode=JSON.stringify;
const clone=()=>structuredClone(emptyResume);
check('valid complete raw v1 roundtrip and optional legacy defaults',()=>{
  assert.deepEqual(parseResumeBuilderDraft(encode(clone())),clone());
  const legacy=clone(); for(const key of ['link','licences','languages','showReferences','accent','layoutStyle'])delete legacy[key];
  assert.deepEqual(parseResumeBuilderDraft(encode(legacy)),clone());
});
check('every string, enum, boolean and array rejects invalid values',()=>{
  for(const key of ['name','title','phone','email','location','link','summary','skills','licences','languages']) {
    for(const bad of [null,5,{},[]])assert.throws(()=>parseResumeBuilderDraft(encode({...clone(),[key]:bad})),key);
  }
  for(const [key,bad] of [['accent','red'],['layoutStyle','wide'],['showReferences','false'],['experiences',null],['education',{}]])assert.throws(()=>parseResumeBuilderDraft(encode({...clone(),[key]:bad})));
});
check('all nested entries and unique ids validated, including late entries',()=>{
  for(const key of ['experiences','education'])for(const field of Object.keys(clone()[key][0])) {
    const data=clone();data[key].push({...data[key][0],id:'second',[field]:7});assert.throws(()=>parseResumeBuilderDraft(encode(data)));
  }
  const duplicate=clone();duplicate.experiences.push({...duplicate.experiences[0]});assert.throws(()=>parseResumeBuilderDraft(encode(duplicate)));
});
check('malformed JSON and data-transfer envelope are not raw Builder backups',()=>{
  for(const raw of ['{','null','[]','{}',encode({version:1,data:{resume:clone()}})])assert.throws(()=>parseResumeBuilderDraft(raw));
});
check('long valid legacy data and hundreds of entries retained exactly',()=>{
  const data=clone();data.summary='Long factual text 한글 '.repeat(6000);data.experiences=Array.from({length:201},(_,i)=>({...data.experiences[0],id:`e-${i}`,details:`${i} ${data.summary}`}));
  data.education=Array.from({length:51},(_,i)=>({...data.education[0],id:`a-${i}`,course:`Course ${i}`}));
  assert.deepEqual(parseResumeBuilderDraft(encode(data)),data);
});
check('empty arrays remain valid, no invented work or education',()=>{
  const data={...clone(),experiences:[],education:[]};assert.deepEqual(parseResumeBuilderDraft(encode(data)),data);assert.equal(resumePlainText(data),'');
});
check('seven essentials use trim, any experience role and actual skill tokens',()=>{
  const data={...clone(),name:' ',title:'\n',phone:'\t',email:' ',summary:' ',skills:',\n,',experiences:[{...clone().experiences[0],role:' '}]};
  assert.equal(resumeEssentialCount(data),0);
  Object.assign(data,{name:'N',title:'T',phone:'P',email:'E',summary:'S',skills:',One\nTwo,'});data.experiences.push({...data.experiences[0],id:'second',role:'Actual role'});
  assert.equal(resumeEssentialCount(data),7);assert.equal(summarizeResumeBuilderDraft(encode(data)).essentialCount,7);
});
check('empty/whitespace print has no headings, placeholders or references',()=>{
  const data=clone();data.name=' ';data.experiences[0].details='\n ';data.showReferences=true;
  assert.equal(resumePlainText(data),'');data.name='Actual';assert.equal(resumePlainText(data),'Actual\n\nREFERENCES\nAvailable upon request');
});
check('output includes only entered work/education and preserves all long content',()=>{
  const data=clone();data.name='Actual';data.experiences[0].details='Actual work '.repeat(10000);data.education[0].course='Actual course';
  const text=resumePlainText(data);assert.ok(text.includes(data.experiences[0].details.trim()));assert.ok(text.includes('Actual course'));assert.doesNotMatch(text,/Your Name|Target Role|Customer service|Company|Dates/);
});
check('goal-only draft makes no experience or personal-quality claims',()=>{
  assert.equal(createFactBasedEnglishDraft('hospitality','none','ignored work'),'Seeking a role in hospitality.');
  assert.throws(()=>createFactBasedEnglishDraft(' ','none',''));assert.throws(()=>createFactBasedEnglishDraft('cafe','confirmed',' '));
});
check('confirmed work is copied exactly, dates and duration never inferred',()=>{
  const work='Completed a one-year course in 2024. I have no cafe work experience.';
  assert.equal(createFactBasedEnglishDraft('hospitality','confirmed',work),`Seeking a role in hospitality.\n${work}`);
});
check('placeholder detection prevents insertion until edited',()=>{
  for(const text of ['[target role]','I worked at {company}.','<insert here>','TODO'])assert.ok(hasWritingPlaceholder(text));
  assert.throws(()=>createFactBasedEnglishDraft('[role]','none',''));assert.throws(()=>createFactBasedEnglishDraft('retail','confirmed','Worked at [company].'));
  assert.equal(hasWritingPlaceholder('Prepared coffee orders.'),false);
});
check('controller reset cancels stale success while preserving subsequent failures',()=>{
  const events=[],timers=[],cancelled=[];
  const c=createResumeBuilderStorageStatusController({onStatusChange:v=>events.push(v),schedule:fn=>(timers.push(fn),timers.length),cancel:id=>cancelled.push(id)});
  c.record('saved');c.reset();c.record('failed');timers[0]();assert.equal(c.getSnapshot().status,'failed');assert.deepEqual(events,['saved','idle','failed']);assert.deepEqual(cancelled,[1]);
  c.dispose();c.reset();assert.equal(c.getSnapshot().status,'failed');
});
console.log(`${passed} Resume Builder safety checks passed.`);
