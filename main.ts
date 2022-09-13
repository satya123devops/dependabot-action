import * as core from '@actions/core';
// import execa = require('execa');
// import { context, getOctokit } from '@actions/github';
// import { combinePRs } from './utils/pull-requests';
import getInputs from './utils/getInputs';
// import { repoPRFetch } from './utils/repoPRFetch'
import axios from 'axios';

const handleError = (err: Error) => {
  core.error(err);
  core.setFailed(`Unhandled error: ${err}`);
};

process.on('unhandledRejection', handleError);

async function fetchPackageName (head_sha: any, base_sha: any, githubToken: any) {
  const { data } = ( await axios.get(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/dependency-graph/compare/${base_sha}...${head_sha}`, {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
  }));
  return data;
};

async function fetchIsMerged (number: any, githubToken: any) {
  try {
    const { status } = ( await axios.get(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/pulls/${number}/merge`, {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
    }));
    if (status === 204) {return true}
  } catch(err) {
    return false
  }
};

function scenario1(openData: any, githubToken: any) {
  let openIndex = 0
  openData.forEach( (data: any) => {
    var head_sha = data.head.sha
    var base_sha = data.base.sha
    const packageName = fetchPackageName(head_sha, base_sha, githubToken)
    packageName.then((packageData) => {
      openIndex++
      if(packageData.length > 0) {
        var packageJsonData = packageData.filter(function(data : any){
          return data.manifest == "package.json";
        });
        for (var data of packageJsonData) {
          core.warning("NAME = " + data.name + "," + " VERSION = " + data.version + "," +
          " DEPENDABOT_CHANGE_TYPE = " + data.change_type + "," +
          " SEVERITY = " + JSON.stringify(data.vulnerabilities))
        }
        if(openIndex === openData.length) {
          core.setFailed("Step Failed")
        }
      } else {
        core.info("hooray.... Step Passed No Dependabot alerts found")
      }
    });
  });
}

function scenario2(closedData: any, githubToken: any) {
    let countSuccess = 0;
    let countFailed = 0;
    let mergingIndex = 0;
    if(closedData.length > 0){
      closedData.forEach( (data: any) => {
        const mergeData = fetchIsMerged(data.number, githubToken)
        mergeData.then((merge: any) => {
          mergingIndex++
          if(merge === true) {
            countSuccess++
          } else {
            countFailed++
          }
          if(mergingIndex === closedData.length) {
            if(closedData.length === countSuccess) {
              core.info("hooray.... Step Passed No Open PR's found created by Dependabot")
            } else {
              core.setFailed("Step Failed because " + countFailed + " PR is/are not merged")
            }
          }
        })
      })
    } else {
      core.info("No closed PR's found")
    }
}

const run = async (): Promise<void> => {
  //console.log("repo url is " + repoPRFetch.URL)
  const combinePullsParams = await getInputs();
  const { githubToken } = combinePullsParams;
  try {
    const { data } = (await axios.get(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}`, {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
    }));
    core.info("process.env brnch is " + process.env.GITHUB_REF?.replace("refs/heads/",''))
    core.info("default_branch is " + data.default_branch)
    if(data.default_branch === process.env.GITHUB_REF?.replace("refs/heads/",'')) {
      try {
        const { data } = (await axios.get(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/pulls?state=all`, {
          headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/json' },
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
              core.info("Open PR's found Created by Dependabot")
              scenario1(openData, githubToken)
            } else {
              core.info("No Open PR's found Created by Dependabot Checking for Closed PR's Merged Status...")
              var closedData = dependabotFilteredData.filter(function(data : any){
                return data.state == 'closed';
              });
              scenario2(closedData, githubToken)
            }
          } else {
            core.info("No dependabot data found")
          }
        } else {
          core.info("No data found")
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
