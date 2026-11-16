import { CaseSolution, SolutionSubmission, SolutionValidationResult } from './case.model';

export function validateSolution(
  solution: CaseSolution,
  submission: SolutionSubmission,
): SolutionValidationResult {
  const submitted = new Map(
    submission.positions.map((position) => [position.characterId, position]),
  );
  const valid =
    submitted.size === solution.positions.length &&
    solution.positions.every((expected) => {
      const actual = submitted.get(expected.characterId);
      return actual !== undefined && actual.x === expected.x && actual.y === expected.y;
    });

  return valid ? { valid: true, killerFound: solution.killerId } : { valid: false };
}
