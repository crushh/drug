(()=>{var e={};e.id=598,e.ids=[598],e.modules={2849:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=2849,e.exports=t},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{"use strict";e.exports=require("buffer")},4770:e=>{"use strict";e.exports=require("crypto")},7702:e=>{"use strict";e.exports=require("events")},8216:e=>{"use strict";e.exports=require("net")},5816:e=>{"use strict";e.exports=require("process")},6162:e=>{"use strict";e.exports=require("stream")},4026:e=>{"use strict";e.exports=require("string_decoder")},5346:e=>{"use strict";e.exports=require("timers")},2452:e=>{"use strict";e.exports=require("tls")},7360:e=>{"use strict";e.exports=require("url")},1764:e=>{"use strict";e.exports=require("util")},1568:e=>{"use strict";e.exports=require("zlib")},5569:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>E,requestAsyncStorage:()=>m,routeModule:()=>c,serverHooks:()=>g,staticGenerationAsyncStorage:()=>p});var n={};r.r(n),r.d(n,{GET:()=>o});var i=r(9303),u=r(8716),a=r(670),s=r(7070),l=r(2198),d=r(1402),_=r(1970);async function o(e){try{let t=new URL(e.url),r=t.searchParams.get("status");if(!r||!r.trim())return(0,d.Bp)("missing query parameter status",["status"]);let n=(0,_.LN)(t.searchParams.get("limit"),50,{min:1,max:200}),i=await (0,l.fV)({status:r,limit:n});return s.NextResponse.json({items:i})}catch(t){let e=t instanceof Error?t.message:"Internal server error";return(0,d.I3)(e)}}let c=new i.AppRouteRouteModule({definition:{kind:u.x.APP_ROUTE,page:"/api/rdc/by-status/route",pathname:"/api/rdc/by-status",filename:"route",bundlePath:"app/api/rdc/by-status/route"},resolvedPagePath:"E:\\project\\drug\\rdc-api\\app\\api\\rdc\\by-status\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:p,serverHooks:g}=c,y="/api/rdc/by-status/route";function E(){return(0,a.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:p})}},1402:(e,t,r)=>{"use strict";r.d(t,{Bp:()=>u,I3:()=>s,v6:()=>a});var n=r(7070);function i({code:e,message:t,status:r,details:i=[]}){return n.NextResponse.json({error:{code:e,message:t,details:i}},{status:r})}function u(e,t=[]){return i({code:"VALIDATION_ERROR",message:e,status:422,details:t})}function a(e){return i({code:"NOT_FOUND",message:e,status:404})}function s(e){return i({code:"SERVER_ERROR",message:e,status:500})}},1970:(e,t,r)=>{"use strict";function n(e,t,{min:r,max:n}={}){if(null===e||""===e.trim())return t;let i=Number.parseInt(e,10);return Number.isNaN(i)?t:"number"==typeof r&&i<r?r:"number"==typeof n&&i>n?n:i}function i(e,t){if(null===e||""===e.trim())return t;let r=e.trim().toLowerCase();return!!["true","1","yes","y"].includes(r)||!["false","0","no","n"].includes(r)&&t}function u(e){return e?new Set(e.split(",").map(e=>e.trim()).filter(Boolean)):new Set}r.d(t,{LN:()=>n,nV:()=>i,t1:()=>u})},2198:(e,t,r)=>{"use strict";r.d(t,{Bf:()=>m,I3:()=>p,fV:()=>c,b_:()=>o,I9:()=>d,cN:()=>_});var n=r(3785);let i=null;function u(){return i||(i=function(){let e={host:process.env.DB_HOST??"127.0.0.1",port:process.env.DB_PORT?Number(process.env.DB_PORT):3306,user:process.env.DB_USER??"root",password:process.env.DB_PASS??"",database:process.env.DB_NAME??"rdcdb",waitForConnections:!0,connectionLimit:10,namedPlaceholders:!0};return n.createPool(e)}()),i}let a=["compound","ligand","linker","chelator","radionuclide"];function s(e){if(null==e)return null;let t=Number(e);return Number.isNaN(t)?null:t}function l(e){if(null==e)return null;if(e instanceof Date)return e.toISOString();let t=new Date(String(e));return Number.isNaN(t.getTime())?null:t.toISOString()}async function d(){let e=u(),[t]=await e.query("SELECT DISTINCT status FROM rdc_drug WHERE status IS NOT NULL AND status <> '' ORDER BY status");return t.map(e=>e.status).filter(e=>"string"==typeof e&&e.trim().length>0).map(e=>({value:e,label:e}))}async function _({q:e,limit:t=20}){let r=u(),n=`%${e.trim()}%`,[i]=await r.query(`SELECT drug_id, drug_name, status FROM rdc_drug
     WHERE drug_name LIKE ?
     ORDER BY drug_name ASC
     LIMIT ?`,[n,Math.min(Math.max(t,1),100)]);return i.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null}))}async function o(e){let t=u(),{page:r,pageSize:n,q:i,status:a,sort:s}=e,d=[],_=[];i&&i.trim()&&(d.push("d.drug_name LIKE ?"),_.push(`%${i.trim()}%`)),a&&a.trim()&&(d.push("d.status = ?"),_.push(a.trim()));let o=d.length?`WHERE ${d.join(" AND ")}`:"",c=function(e){switch(e){case"drug_name:asc":return"d.drug_name ASC";case"drug_name:desc":return"d.drug_name DESC";case"created_at:asc":return"d.created_at ASC";default:return"d.created_at DESC"}}(s),m=Math.max(r,1),p=Math.min(Math.max(n,1),100),[g]=await t.query(`SELECT
       d.drug_id,
       d.drug_name,
       d.status,
       d.type,
       MAX(CASE WHEN dcr.relation_role = 'compound' THEN ce.name END) AS cold_compound_name,
       MAX(CASE WHEN dcr.relation_role = 'ligand' THEN ce.name END) AS ligand_name,
       MAX(CASE WHEN dcr.relation_role = 'linker' THEN ce.name END) AS linker_name,
       MAX(CASE WHEN dcr.relation_role = 'chelator' THEN ce.name END) AS chelator_name,
       MAX(CASE WHEN dcr.relation_role = 'radionuclide' THEN ce.name END) AS radionuclide_name,
       d.created_at
     FROM rdc_drug d
     LEFT JOIN drug_chemical_rel dcr ON d.drug_id = dcr.drug_id
     LEFT JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     ${o}
     GROUP BY d.drug_id, d.drug_name, d.status, d.type, d.created_at
     ORDER BY ${c}
     LIMIT ? OFFSET ?`,[..._,p,(m-1)*p]),[y]=await t.query(`SELECT COUNT(*) AS total FROM rdc_drug d ${o}`,_),E=Number(y[0]?.total??0);return{items:g.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null,type:e.type??null,cold_compound_name:e.cold_compound_name??null,ligand_name:e.ligand_name??null,linker_name:e.linker_name??null,chelator_name:e.chelator_name??null,radionuclide_name:e.radionuclide_name??null,created_at:l(e.created_at)})),page:m,page_size:p,total:E}}async function c({status:e,limit:t=50}){let r=u(),[n]=await r.query(`SELECT drug_id, drug_name, status
     FROM rdc_drug
     WHERE status = ?
     ORDER BY drug_name ASC
     LIMIT ?`,[e.trim(),Math.min(Math.max(t,1),200)]);return n.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null}))}async function m(e){let t=u(),[r]=await t.query(`SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       updated_at
     FROM rdc_drug
     WHERE drug_name = ?
     LIMIT 1`,[e.trim()]);if(0===r.length)return;let n=r[0];return{drug_id:n.drug_id,external_id:n.external_id??null,drug_name:n.drug_name,drug_synonyms:n.drug_synonyms??null,status:n.status??null,type:n.type??null,smiles:n.smiles??null,structure_image:n.structure_image??null,chebi_id:n.chebi_id??null,pubchem_cid:n.pubchem_cid??null,pubchem_sid:n.pubchem_sid??null,updated_at:l(n.updated_at)}}async function p(e,t={}){let r=u(),[n]=await r.query(`SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       created_at,
       updated_at
     FROM rdc_drug
     WHERE drug_id = ?
     LIMIT 1`,[e]);if(0===n.length)return;let i=n[0],a=t.expand??new Set,s=t.allEntities??!1,d={general:{drug_id:i.drug_id,external_id:i.external_id??null,drug_name:i.drug_name,drug_synonyms:i.drug_synonyms??null,status:i.status??null,type:i.type??null,smiles:i.smiles??null,structure_image:i.structure_image??null,chebi_id:i.chebi_id??null,pubchem_cid:i.pubchem_cid??null,pubchem_sid:i.pubchem_sid??null,created_at:l(i.created_at),updated_at:l(i.updated_at)}};return d.chemicals=await g(e,s),a.has("human_activity")&&(d.human_activity=await y(e)),a.has("animal_in_vivo")&&(d.animal_in_vivo=await E(e)),a.has("in_vitro")&&(d.in_vitro=await v(e)),d}async function g(e,t){let r=u(),[n]=await r.query(`SELECT dcr.relation_role, dcr.chemical_entity_id, ce.name
     FROM drug_chemical_rel dcr
     JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     WHERE dcr.drug_id = ?
     ORDER BY dcr.relation_role, ce.name`,[e]),i={compound:null,ligand:null,linker:null,chelator:null,radionuclide:null},s={compound:[],ligand:[],linker:[],chelator:[],radionuclide:[]};for(let e of n){let t=String(e.relation_role??"").toLowerCase();a.includes(t)&&(i[t]||(i[t]=e.name??null),s[t].push({entity_id:e.chemical_entity_id,name:e.name??"",relation_role:e.relation_role}))}let l={compound_name:i.compound,ligand_name:i.ligand,linker_name:i.linker,chelator_name:i.chelator,radionuclide_name:i.radionuclide};return t&&(l.entities=s),l}async function y(e){let t=u(),[r]=await t.query(`SELECT clinical_trial_number, indication, patients, dosage, frequency,
            results_description, purpose, clinical_endpoint, endpoint_period,
            efficacy_description, adverse_events_summary, security_indicators
     FROM human_activity
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);return r.map(e=>({clinical_trial_number:e.clinical_trial_number??null,indication:e.indication??null,patients:e.patients??null,dosage:e.dosage??null,frequency:e.frequency??null,results_description:e.results_description??null,purpose:e.purpose??null,clinical_endpoint:e.clinical_endpoint??null,endpoint_period:e.endpoint_period??null,efficacy_description:e.efficacy_description??null,adverse_events_summary:e.adverse_events_summary??null,security_indicators:e.security_indicators??null}))}async function E(e){let t=u(),[r]=await t.query(`SELECT study_id, pmid, doi
     FROM animal_in_vivo_study
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);if(0===r.length)return{studies:[]};let n=r.map(e=>e.study_id),i=n.map(()=>"?").join(","),[a]=await t.query(`SELECT * FROM animal_in_vivo_pk WHERE study_ref_id IN (${i}) ORDER BY id ASC`,n),[s]=await t.query(`SELECT * FROM animal_in_vivo_biodist WHERE study_ref_id IN (${i}) ORDER BY id ASC`,n),[l]=await t.query(`SELECT * FROM animal_in_vivo_efficacy WHERE study_ref_id IN (${i}) ORDER BY id ASC`,n),d=R(a,e=>e.study_ref_id),_=R(s,e=>e.study_ref_id),o=R(l,e=>e.study_ref_id);return{studies:r.map(e=>{let t=e.study_id;return{study_id:t,pmid:e.pmid??null,doi:e.doi??null,pk:(d.get(t)??[]).map(f),biodistribution:(_.get(t)??[]).map(h),efficacy:(o.get(t)??[]).map(b)}})}}function f(e){return{pk_animal_model:e.pk_animal_model??null,pk_dosage_symbols:e.pk_dosage_symbols??null,pk_dosage_value:s(e.pk_dosage_value),pk_dosage_unit:e.pk_dosage_unit??null,pk_description:e.pk_description??null,half_life:e.half_life??null,pk_image:e.pk_image??null}}function h(e){return{biodist_type:e.biodist_type??null,animal_model:e.animal_model??null,dosage_symbols:e.dosage_symbols??null,dosage_value:s(e.dosage_value),dosage_unit:e.dosage_unit??null,metabolism:e.metabolism??null,excretion:e.excretion??null,detection_time:e.detection_time??null,tumor_retention_time:e.tumor_retention_time??null,tbr:{tumor_blood:s(e.tbr_tumor_blood),tumor_muscle:s(e.tbr_tumor_muscle),tumor_kidney:s(e.tbr_tumor_kidney),tumor_salivary_glands:s(e.tbr_tumor_salivary_glands),tumor_liver:s(e.tbr_tumor_liver),tumor_lung:s(e.tbr_tumor_lung),tumor_heart:s(e.tbr_tumor_heart)},biodist_result_image:e.biodist_result_image??null,biodist_description:e.biodist_description??null}}function b(e){return{efficacy_animal_model:e.efficacy_animal_model??null,efficacy_dosage_symbols:e.efficacy_dosage_symbols??null,efficacy_dosage_value:s(e.efficacy_dosage_value),efficacy_dosage_unit:e.efficacy_dosage_unit??null,efficacy_description:e.efficacy_description??null,adverse_reactions:e.adverse_reactions??null}}async function v(e){let t=u(),[r]=await t.query(`SELECT in_vitro_id, study_overview, notes
     FROM in_vitro
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);if(0===r.length)return{studies:[]};let n=r.map(e=>e.in_vitro_id),i=n.map(()=>"?").join(","),[a]=await t.query(`SELECT * FROM in_vitro_measurement WHERE in_vitro_ref_id IN (${i}) ORDER BY id ASC`,n),l=new Map;for(let e of a){let t=e.measurement_category??"other";l.has(t)||l.set(t,[]),l.get(t).push({measurement_type:e.measurement_type??null,measurement_symbols:e.measurement_symbols??null,measurement_value:s(e.measurement_value),measurement_unit:e.measurement_unit??null,method_description:e.method_description??null})}return{studies:r.map(e=>({in_vitro_id:e.in_vitro_id,study_overview:e.study_overview??null,notes:e.notes??null})),...Object.fromEntries(l.entries())}}function R(e,t){let r=new Map;for(let n of e){let e=t(n);r.has(e)||r.set(e,[]),r.get(e).push(n)}return r}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[276,972,785],()=>r(5569));module.exports=n})();