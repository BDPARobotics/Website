"use client";

import { useState } from "react";
import { ArmSimulator } from "./ArmSimulator";
import { ChallengeSubmission } from "@/components/challenge-submission";
import { ModuleChat } from "@/components/module-chat";
import { ModuleContent } from "@/components/module-content";
import type { ArmChallenge, ContentBlock } from "@/lib/types";

// Client wrapper for arm_challenge modules that have real simulator data —
// lives above the ArmSimulator/ChallengeSubmission/ModuleChat sibling trio so
// a run's code + verdict can be shared: prefills the submission form and
// gives the AI tutor the student's live code/results, not just their last
// saved submission.
export function ChallengeModuleBody({
  moduleId,
  contentBlocks,
  armChallenge,
}: {
  moduleId: string;
  contentBlocks: ContentBlock[];
  armChallenge: ArmChallenge;
}) {
  const [lastRun, setLastRun] = useState<{ code: string; passed: boolean; summary: string } | null>(
    null,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <ModuleContent blocks={contentBlocks} />

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#233242]">Try it yourself</h2>
          <p className="mt-1 text-sm text-gray-500">
            Write your code, hit Run, and watch the simulated arm carry it out.
          </p>
          <div className="mt-3">
            <ArmSimulator challenge={armChallenge} onRunComplete={setLastRun} />
          </div>
        </div>

        <ChallengeSubmission
          moduleId={moduleId}
          prefillCode={lastRun?.code}
          simulatorSummary={lastRun?.summary}
        />
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ModuleChat moduleId={moduleId} code={lastRun?.code} lastResults={lastRun?.summary} />
      </aside>
    </div>
  );
}
