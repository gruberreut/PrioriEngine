import { useState } from "react";
import { ParamsForm, type RankParams } from "../ParamsForm/ParamsForm";
import { ResultsPanel, type RankResultMode } from "../ResultsPanel/ResultsPanel";
import styles from "./RankingPage.module.css";

const MOCK_RESULT: RankResultMode = {
  mode: "recommendations",
  tasks: [
    {
      task: { id: "t1", title: "Repot the tomato seedlings", duration: 30, energyRequired: "medium", location: "home", contexts: ["physical"] },
      breakdown: { priorityScore: 0.8, urgencyScore: 0.6, energyScore: 0.5, durationScore: 0.4, flowBonus: 0.2, suggestionPenalty: 0, totalScore: 2.5, reasons: ["High priority"] },
    },
    {
      task: { id: "t2", title: "Pay utility bill", duration: 15, energyRequired: "low", location: "home", contexts: ["admin"] },
      breakdown: { priorityScore: 0.6, urgencyScore: 0.4, energyScore: 0.7, durationScore: 0.6, flowBonus: 0, suggestionPenalty: 0, totalScore: 2.3, reasons: [] },
    },
    {
      task: { id: "t3", title: "Read a page in French", duration: 5, energyRequired: "low", location: "anywhere", contexts: ["learning"] },
      breakdown: { priorityScore: 0.5, urgencyScore: 0.5, energyScore: 0.3, durationScore: 0.8, flowBonus: 0, suggestionPenalty: -0.1, totalScore: 2.0, reasons: ["Recently suggested"] },
    },
  ],
};

type View = "form" | "results";

export function RankingPage() {
  const [view, setView] = useState<View>("form");
  const [result, setResult] = useState<RankResultMode | undefined>(undefined);
  const [explain, setExplain] = useState(false);

  function handleSubmit(params: RankParams) {
    setExplain(params.explain);
    setResult({ ...MOCK_RESULT, explain: params.explain } as RankResultMode);
    setView("results");
  }

  function handleBack() {
    setView("form");
  }

  return (
    <div className={styles.page}>
      {view === "form" ? (
        <ParamsForm contexts={["creativity", "learning", "admin", "physical"]} onSubmit={handleSubmit} />
      ) : (
        <ResultsPanel result={result} onBack={handleBack} />
      )}
    </div>
  );
}
