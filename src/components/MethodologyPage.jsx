import React from 'react'

function Step({ n, title, children }) {
  return (
    <div className="method-step">
      <div className="method-step-num" aria-hidden="true">{n}</div>
      <div className="method-step-body">
        <h3 className="method-step-title">{title}</h3>
        <div className="method-step-content">{children}</div>
      </div>
    </div>
  )
}

function FormulaBlock({ children }) {
  return <pre className="formula-block">{children}</pre>
}

export default function MethodologyPage({ onNavigate }) {
  return (
    <section className="page methodology-page" aria-labelledby="method-title">
      <div className="page-header">
        <div>
          <h1 id="method-title" className="page-title">How the score works</h1>
          <p className="page-subtitle">A transparent explanation of every input, formula, and limitation behind the injustice score.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => onNavigate('')}>Back to rankings</button>
      </div>

      <div className="method-steps">
        <Step n="1" title="Social signal collection">
          <p>We collect public posts mentioning a player by name from X (Twitter) and Reddit. Each post is run through a fine-tuned sentiment classifier trained on football-specific language — including common slang, sarcasm markers, and abuse keywords.</p>
          <p>From this we compute a daily <strong>negative post ratio</strong>: the proportion of posts that are classified as negative or abusive out of total mentions that day.</p>
          <FormulaBlock>{`negative_ratio = negative_posts / total_mentions`}</FormulaBlock>
        </Step>

        <Step n="2" title="Hate score">
          <p>The hate score is the 7-day rolling average of the negative ratio, scaled to a 0–10 range relative to all players in the same league and season window. A score of 10 means the player is receiving more hate (proportionally) than anyone else in that league this season.</p>
          <FormulaBlock>{`hate_score = percentile_rank(avg_7d_negative_ratio) / 10`}</FormulaBlock>
        </Step>

        <Step n="3" title="Performance score">
          <p>For each player we compute a composite performance percentile using role-relevant stats from the current season. These stats are sourced from FBref-compatible data via soccerdata.</p>
          <p>Stats weighted by position:</p>
          <ul className="method-list">
            <li><strong>Forwards / attacking mids:</strong> npxG, xA, progressive carries, shot-creating actions</li>
            <li><strong>Central midfielders:</strong> progressive passes, ball recoveries, press regain rate, xa</li>
            <li><strong>Defenders:</strong> defensive actions, aerial win %, interceptions, progressive carries</li>
            <li><strong>Goalkeepers:</strong> PSxG difference, claim rate, launch success rate</li>
          </ul>
          <p>Each stat is ranked against all players in the same league, position group, and season with a minimum of 450 minutes played.</p>
          <FormulaBlock>{`performance_percentile = avg(rank_per_stat) across role-relevant stats`}</FormulaBlock>
        </Step>

        <Step n="4" title="Expectation baseline">
          <p>Some players are genuinely underperforming relative to their wages, transfer fee, or past peak — and mild criticism may be warranted. We compute an expected hate level based on:</p>
          <ul className="method-list">
            <li>Current performance percentile (lower = more criticism is expected)</li>
            <li>Wage tier relative to league peers (higher wages raise expectations)</li>
            <li>Age and career trajectory (young players given more variance tolerance)</li>
          </ul>
          <FormulaBlock>{`expected_hate = f(performance_percentile, wage_tier, age_factor)`}</FormulaBlock>
        </Step>

        <Step n="5" title="Bias gap & injustice score">
          <p>The bias gap is the raw difference between the hate score and the expected hate level. A positive gap means the player is receiving more hate than their performance justifies.</p>
          <FormulaBlock>{`bias_gap = hate_score - expected_hate

injustice_score = clamp(bias_gap * 1.5 + performance_boost, 0, 10)
  where performance_boost = (100 - performance_percentile) / 20`}</FormulaBlock>
          <p>The injustice score ranges 0–10. Scores above 7 indicate severe disproportionality. Scores below 3 suggest the player's criticism is roughly in line with their output.</p>
        </Step>
      </div>

      <div className="caveats-section">
        <h2 className="panel-heading">Limitations & caveats</h2>
        <ul className="caveat-list">
          <li>
            <strong>Sarcasm and irony.</strong> Sentiment classifiers frequently misread sarcasm. A post like "absolutely world class mistake" may be flagged as positive. We apply a sarcasm correction layer but false positives remain a known issue.
          </li>
          <li>
            <strong>Rival fan noise.</strong> During derby weeks or cup matches, opposition fans inflate hate volume for players on the opposing team regardless of performance. We do not yet apply a fixture calendar correction.
          </li>
          <li>
            <strong>Viral moment spikes.</strong> A single high-profile error can cause a one-day spike that inflates the 7-day rolling average. We plan to add an outlier clipping step.
          </li>
          <li>
            <strong>Stats don't capture everything.</strong> A player may be contributing defensively or tactically in ways that the available data doesn't capture — for example, pressing triggers, off-ball movement, or leadership under pressure.
          </li>
          <li>
            <strong>Source coverage.</strong> We currently index X (Twitter) and Reddit only. Instagram, TikTok comments, and football forums are not yet included, meaning hate on those platforms is not reflected.
          </li>
          <li>
            <strong>Wage data accuracy.</strong> Wage estimates are sourced from public reports (Capology, Spotrac). Actual contract values may differ and affect the expectation baseline.
          </li>
        </ul>
      </div>

      <div className="method-footer">
        <p>Questions, corrections, or false positives? Open an issue on <a href="https://github.com/TariqH19/football-bias-tracker-app" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
      </div>
    </section>
  )
}
