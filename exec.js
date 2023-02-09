const { execSync } = require('child_process');
module.exports=function(command,path,encoding='utf8'){

  path = path || process.cwd();

  let result=false,stdout=null,stderr=null ;
  
  try {

    stdout = execSync(command,{cwd:path,encoding,timeout:1000*60*10});

    result = true;

  } catch (error) {

    stderr = error;
    
  }

  return {result,error:stderr,stdout,stderr}
  
}