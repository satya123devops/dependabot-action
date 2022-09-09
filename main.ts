import * as core from '@actions/core';
// import execa = require('execa');
// import { context, getOctokit } from '@actions/github';
// import { combinePRs } from './utils/pull-requests';
// import getInputs from './utils/getInputs';
// import { repoPRFetch } from './utils/repoPRFetch'
import axios from 'axios';
const token = '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'

const handleError = (err: Error) => {
  core.error(err);
  core.setFailed(`Unhandled error: ${err}`);
};

process.on('unhandledRejection', handleError);

async function fetchPackageName (head_sha: any, base_sha: any) {
  const { data } = ( await axios.get(`https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/dependency-graph/compare/${base_sha}...${head_sha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  }));
  return data;
};

async function fetchIsMerged (number: any) {
  try {
    const { status } = ( await axios.get(`https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/pulls/${number}/merge`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }));
    if (status === 204) {return true}
  } catch(err) {
    return false
  }
};

function scenario1(openData: any) {
  let openIndex = 0
  openData.forEach( (data: any) => {
    var head_sha = data.head.sha
    var base_sha = data.base.sha
    const packageName = fetchPackageName(head_sha, base_sha)
    packageName.then((packageData) => {
      openIndex++
      if(packageData.length > 0) {
        var packageJsonData = packageData.filter(function(data : any){
          return data.manifest == "package.json";
        });
        for (var data of packageJsonData) {
          console.log("NAME = " + data.name + "," + " VERSION = " + data.version + "," +
          " DEPENDABOT_CHANGE_TYPE = " + data.change_type + "," +
          " SEVERITY = " + JSON.stringify(data.vulnerabilities))
        }
        if(openIndex === openData.length) {
          console.log("Process Failed")
        }
      } else {
        console.log("Process Passed")
      }
    });
  });
}

function scenario2(closedData: any) {
    let countSuccess = 0;
    let countFailed = 0;
    let mergingIndex = 0;
    if(closedData.length > 0){
      closedData.forEach( (data: any) => {
        const mergeData = fetchIsMerged(data.number)
        mergeData.then((merge: any) => {
          mergingIndex++
          if(merge === true) {
            countSuccess++
          } else {
            countFailed++
          }
          if(mergingIndex === closedData.length) {
            if(closedData.length === countSuccess) {
              console.log("Process Passed")
            } else {
              console.log("Process Failed because " + countFailed + " PR is/are not merged")
            }
          }
        })
      })
    } else {
      console.log("No closed Data found")
    }
}

const run = async (): Promise<void> => {
  //console.log("repo url is " + repoPRFetch.URL)
  try {
    const { data } = (await axios.get(`https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }));
    console.log(process.env)
    console.log("default_branch is " + data.default_branch)
    if(data.default_branch === 'main') {
      try {
        const { data } = (await axios.get(`https://api.github.com/repos/satya123devops/Code-Pipeline-Demo-After/pulls?state=all`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }));
        if(data.length > 0) {
          var dependabotFilteredData = data.filter(function(data : any){
            return data.user.login.includes('dependabot');
          });
          if(dependabotFilteredData.length > 0) {
            var openData = dependabotFilteredData.filter(function(data : any){
              return data.state == 'open';
            });
            if(openData.length > 0) {
              console.log("Open data found")
              scenario1(openData)
            } else {
              console.log("No open data found")
              var closedData = dependabotFilteredData.filter(function(data : any){
                return data.state == 'closed';
              });
              scenario2(closedData)
            }
          } else {
            console.log("No dependabot data found")
          }
        } else {
          console.log("No data found")
        }
        
        // const combinePullsParams = await getInputs();
        // const { githubToken } = combinePullsParams;
        // const githubClient = getOctokit(githubToken);
  
        // await execa('git', ['config', 'user.name', 'github-actions']);
        // await execa('git', ['config', 'user.email', 'github-actions@github.com']);
  
        // await combinePRs(githubClient, context.repo, combinePullsParams);
      } catch (e) {
        core.setFailed(`combine-dependabot-pulls: ${(e as Error).message}`);
      }
    } else {
      console.log("No main branch found")
    }
  } catch (err) {
    core.setFailed(`combine-dependabot-branch: ${(err as Error).message}`);
  }
};

run().catch(handleError);
