import * as wrap from 'wrap-ansi';
import chalk from 'chalk';

import {
  AnnotatedIssue,
  CallPath,
  REACHABILITY,
} from '../../../../lib/snyk-test/legacy';
import { SampleReachablePaths } from './types';

// Number of function names to show in the beginning of an abbreviated code path
const LEADING_PATH_ELEMENTS = 2;

// Number of function names to show in the end of an abbreviated code path
const TRAILING_PATH_ELEMENTS = 2;

const reachabilityLevels: {
  [key in REACHABILITY]: { color: Function; text: string };
} = {
  [REACHABILITY.FUNCTION]: {
    color: chalk.redBright,
    text: 'Reachable',
  },
  [REACHABILITY.PACKAGE]: {
    color: chalk.yellow,
    text: 'Potentially reachable',
  },
  [REACHABILITY.NOT_REACHABLE]: {
    color: chalk.blueBright,
    text: 'Not reachable',
  },
  [REACHABILITY.NO_INFO]: {
    color: (str) => str,
    text: '',
  },
};

export function formatReachability(reachability?: REACHABILITY): string {
  if (!reachability) {
    return '';
  }
  const reachableInfo = reachabilityLevels[reachability];
  const textFunc = reachableInfo ? reachableInfo.color : (str) => str;
  const text =
    reachableInfo && reachableInfo.text ? `[${reachableInfo.text}]` : '';

  return wrap(textFunc(text), 100);
}

export function getReachabilityText(reachability?: REACHABILITY): string {
  if (!reachability) {
    return '';
  }
  const reachableInfo = reachabilityLevels[reachability];
  return reachableInfo ? reachableInfo.text : '';
}

export function summariseReachableVulns(
  vulnerabilities: AnnotatedIssue[],
): string {
  const reachableVulnsCount = vulnerabilities.filter(
    (v) => v.reachability === REACHABILITY.FUNCTION,
  ).length;

  if (reachableVulnsCount > 0) {
    const vulnText =
      reachableVulnsCount === 1 ? 'vulnerability' : 'vulnerabilities';
    return `In addition, found ${reachableVulnsCount} ${vulnText} with a reachable path.`;
  }

  return '';
}

function getDistinctReachablePaths(
  reachablePaths: CallPath[],
  maxPathCount: number,
): string[] {
  const uniquePaths = new Set<string>();
  for (const path of reachablePaths) {
    if (uniquePaths.size >= maxPathCount) {
      break;
    }
    uniquePaths.add(formatReachablePath(path));
  }
  return Array.from(uniquePaths.values());
}

export function formatReachablePaths(
  sampleReachablePaths: SampleReachablePaths | undefined,
  maxPathCount: number,
  template: (samplePaths: string[], extraPathsCount: number) => string,
): string {
  const paths = sampleReachablePaths?.paths || [];
  const pathCount = sampleReachablePaths?.pathCount || 0;
  const distinctPaths = getDistinctReachablePaths(paths, maxPathCount);
  const extraPaths = pathCount - distinctPaths.length;

  return template(distinctPaths, extraPaths);
}

export function formatReachablePath(path: CallPath): string {
  const head = path.slice(0, LEADING_PATH_ELEMENTS).join('>');
  const tail = path
    .slice(path.length - TRAILING_PATH_ELEMENTS, path.length)
    .join('>');
  return `${head} > ... > ${tail}`;
}
