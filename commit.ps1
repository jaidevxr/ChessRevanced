$files = @(
    @{ "file" = "src/index.css"; "msg" = "style(css): apply flat global styles and remove complex glows" },
    @{ "file" = "src/App.jsx"; "msg" = "refactor(app): remove AI terminology and simplify main dashboard layout" },
    @{ "file" = "src/components/GamesTab.jsx"; "msg" = "style(games): remove ML model references and flatten component gradients" },
    @{ "file" = "src/components/CoachTab.jsx"; "msg" = "refactor(insights): rename CoachTab to Strategic Insights and remove Claude AI references" },
    @{ "file" = "src/components/GameReview.jsx"; "msg" = "refactor(review): flatten game review layout and swap AI terminology for structural analysis" },
    @{ "file" = "src/components/OverviewTab.jsx"; "msg" = "style(overview): replace background gradients with solid cream tokens" },
    @{ "file" = "src/components/OpeningsTab.jsx"; "msg" = "style(openings): convert UI panels to use flat minimalist aesthetic" },
    @{ "file" = "src/components/Markdown.jsx"; "msg" = "chore(markdown): update component header description" },
    @{ "file" = "src/components/EvalBar.jsx"; "msg" = "style(evalbar): flatten advantage bar gradient to solid cream" },
    @{ "file" = "train_eval_nn.js"; "msg" = "fix(training): replace tfjs node with pure js version to resolve dlopen failed" },
    @{ "file" = "package.json"; "msg" = "chore(pkg): add scripts to support massive evaluation streaming" },
    @{ "file" = "src/engine.js"; "msg" = "feat(engine): implement stockfish wdl curves and hybrid score evaluation" }
)

foreach ($item in $files) {
    git add $item.file
    git commit -m $item.msg
}
