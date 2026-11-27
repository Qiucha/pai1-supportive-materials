# Martini-glass guides for interactive labs: what the evidence says

Research ticket: #6. Feeds the design decision in #7: how many steps, how many words per step, the step structure (predict, act, notice), what counts as a step being done, and how skipping works.

Researched 2026-11-27.

## How sure each source is

Each source is labelled with how much of it was actually read:

- **[full]**: the full text was read for this note.
- **[abstract]**: only the abstract or the authors' own summary page was read.
- **[secondary]**: the numbers come from a talk or summary, not the paper's own text.
- **[vendor]**: industry data. Not peer reviewed, and it measures completion, not learning.

Most of the tutorial studies (Andersen, NN/g, Chameleon, Kelleher) measured **engagement or task success in games and apps, not learning**. Conlen measured reader behaviour. Only the prediction studies (Crouch, Kim, Brod) and the discovery meta-analysis (Alfieri) measured learning.

## Headline

1. **Segel & Heer give the shape but no numbers.** A short author-driven "stem" opens into free exploration. They give no step count and no word count, and they list "how critical is it to provide either explicit instruction or tacit tutorials?" as an open question. [full]
2. **The best evidence is for prediction prompts.** Learners who commit to a prediction before seeing the result understand and remember it better. Watching alone barely helps. Recommendation: make "predict" a real, recorded choice. [Crouch: secondary, from the first author's slides. Kim, Brod: abstract]
3. **Do, but don't force.** Acting beats reading. But locking the interface to force the "right" action added nothing in a 45,000-player study. [Andersen: full] Stencils-style forced tutorials were finished faster but did not produce more learning. [Kelleher: authors' summary]
4. **Most people won't read much, and the effect fades fast.** People act on the first prompt or two, then drop off. Content hidden behind a click is often never seen. [Conlen: full] Users who skipped an app tutorial did just as well and rated the task easier. [NN/g: full]
5. **An intro story may not increase exploration.** This is the only direct field test of "story first, then explore" that was found, and it challenges the premise of #7. Adding introductory stories to exploratory visualisations did not increase how much people explored. [Boy et al.: abstract]

## Decisions for #7

### 1. Number of steps and words per step

**Recommendation (judgement, not a finding):** 3 to 4 steps. One instruction or question per step, about 15 to 30 words. Highlight the control instead of describing it.

**Evidence. Weak.**
- No source found gives a peer-reviewed optimum for step count or text length.
- Segel & Heer describe stems as "short" or "long" depending on how much authoring there is (a question, an observation, or a whole article). This is a qualitative design-space analysis of 58 examples, not a user study. [full]
- The only step-count data is vendor data from SaaS product tours. In 2020 (214M interactions), 3-step tours had the highest completion of the multi-step tours (66%), completion fell below 50% after 5 steps, and engagement dropped sharply after 8. [vendor] Their 2023 report says 4-step tours overtook 3-step ones. [vendor, from search summary only]
- Indirect support for keeping text short:
  - Andersen et al. concluded that players "seem to learn more from experimentation than from reading text". [full]
  - In Conlen et al., median engagement with a prompted task was one session (guitar tuner: median 1 tuning session, IQR 0 to 4). Only 45% of readers reached the end of that article. [full]

The 3 to 4 figure is an inference from these sources. Do not cite it as a finding.

### 2. Step structure: predict, then act, then notice

**Recommendation:** Use predict, act, notice for the 1 or 2 steps that carry the lab's main idea, not for every step. The prediction must be an explicit commitment, such as picking an option, dragging a marker, or typing a number. "Think about what will happen" is not enough. The "notice" text should show the learner's prediction next to the actual result.

**Evidence. Moderate to strong for prediction. Weak for the full three-part structure.**
- **Crouch, Fagen, Callan & Mazur (2004)**, physics lecture demonstrations. Students who wrote a prediction on a worksheet before the demo did better than students who only watched. Figures are from Crouch's 2006 conference slides on the same study. [secondary]

  | Condition | Correct outcome | Fully correct explanation |
  |---|---|---|
  | No demo | 61% | 22% |
  | Observe only | 70% | 24% (p = 0.64 vs no demo) |
  | Predict | 77% | 30% (p = 0.04) |
  | Predict and discuss | 82% | 32% (p = 0.01) |

  The paper's abstract says observing alone did not raise understanding, and predicting did.
- **Kim, Reinecke & Hullman (2017)**, CHI best paper. Asking people to predict data (by drawing it) and then explain the gap improved recall and comprehension compared with just viewing the data. The effect held for people with little or moderate prior knowledge. [abstract]
- **Brod, Hasselhorn & Bunge (2018).** Making a prediction improved learning. The pupil "surprise" response appeared only after a prediction, and the size of the surprise tracked how much was learned. For #7 this means a prediction step pays off most when the result can be surprising. [abstract]
- **Predict-Observe-Explain** (White & Gunstone, *Probing Understanding*, 1992) is the standard name for this pattern in science teaching. Background, not checked.

### 3. Act or only show, and what counts as "done"

**Recommendation:**
- A step is done when the learner performs the prompted action on the real control, for example moves the slider past a threshold or presses "sample".
- Do not lock or grey out the other controls.
- Do not ask for a perfect result. Any real attempt at the action counts.
- Advance on the action itself, not on a "Next" click. Keep "Next" as a fallback.

**Evidence. Moderate, and the sources pull in two directions:**
- *Doing beats watching:*
  - Koedinger et al. (2015, L@S), a MOOC study. Each practice activity was associated with about six times more learning than each page read or video watched. Their data were correlational, with causal-inference checks. [secondary, from a CMU press release]
  - Crouch's observe-only condition gave almost no benefit (see above).
  - Alfieri et al. (2011), a meta-analysis of 164 studies. Unassisted discovery did worse than explicit instruction (d = −0.38, 580 comparisons). Enhanced or guided discovery did better than other methods (d = 0.30, 360 comparisons). The helpful forms were "feedback, worked examples, scaffolding, and elicited explanations". [abstract read]
- *Forcing it does not help:*
  - Andersen et al. (2012), over 45,000 players in 3 games. "We found no evidence to support the claim that restricting player freedom in order to focus the player's attention on a target concept improves learnability." They also suggest "that forcing the player to perform a series of actions may not be effective". [full]
  - Kelleher & Pausch (2005), Stencils. Stencils are overlays that block clicks outside the target element. Users finished 26% faster, made fewer mistakes and needed less human help, but quiz scores were no different from a paper tutorial. [authors' summary]

Read together: having learners act matters, but blocking everything else buys speed, not learning.

### 4. When to hand over to free exploration

**Recommendation:**
- Hand over straight after the last guided action, with a short line that says what to try next. Keep this a question, not a task list.
- Make every guided step use the real controls, so the guide is also the tutorial for those controls. Then nothing new needs explaining at handover.
- Start the free stage from an interesting default state, not a blank one.

**Evidence. Weak to moderate.**
- Segel & Heer's "tacit tutorial" introduces interactive features by animating them as part of the story, "by the time the presentation encourages the user to investigate … it is already clear to the user how to do this". They found tacit tutorials and "stimulating default views" rarely used in their corpus. A counterexample (the MPR employment explorer) "dropped readers into the data with little orientation". [full]
- In Segel & Heer's Gapminder example, the hand-off is itself a prompt ("Use the timebar to see people in Asia moving out of poverty"), so "the interactivity is actually a continuation of the story". [full]
- Andersen et al. found that giving instructions just before they are needed, rather than in an up-front manual, increased play time by 16% in the complex game (Foldit). It had no effect in the two simpler games. [full]

### 5. Skipping, and how guides fail

**Recommendation:**
- Always offer a visible "Skip guide" control.
- Never block the lab behind the guide.
- Let a skipped or finished guide be replayed from a small control.
- Don't put anything essential only inside a step a learner might skip. Key ideas should also appear in the lab text or the default view.
- Don't add a separate "help" panel just because you can (see the Andersen result below).

**Evidence for each failure mode:**
- **Skipping costs little, and tutorials can make things look harder.** NN/g (Kendrick, 2020) studied 70 users across 4 iOS apps. Task success was 91% for those who read the tutorial and 94% for those who skipped it (not significant). Skippers rated the task easier (5.49 vs 4.92 on a 1 to 7 scale, p = 0.047). NN/g's advice: "Think twice about creating a tutorial for simple applications." [full]
- **Tutorials matter only when the interface is complex or unusual.** In Andersen et al., tutorials increased play time by up to 29% in Foldit and had a "surprisingly negligible" effect in the two simpler games. [full] Simple single-slider labs may need little or no guide. Labs with several linked controls need one more.
- **On-demand help can backfire.** In Andersen et al.'s game Refraction, adding a help button reduced progress by 12% and play time by 15%. [full]
- **Content behind a click often goes unseen.** "If details were only revealed after a click, readers may never see it." About half of desktop readers and 38% of mobile readers who reached the end opened the optional details. Readers did engage with widgets that were central to the story. [Conlen: full]
- **Engagement fades, especially on mobile.** On mobile, median time on page was 23% to 52% of desktop. Only 34% of mobile readers tried the guitar tuner, and 6% tuned all six strings. [Conlen: full]
- **An intro story did not increase exploration.** Boy, Détienne & Fekete (2015) ran three web field experiments. "Augmenting exploratory visualizations with introductory 'stories' does not seem to increase user-engagement in exploration." [abstract] So "the guide was completed" should not be taken as proof that the guide drives exploration. Measure it if possible.

## Where the evidence is weak

- No source found sets an optimal step count or word count. Any number in #7 is a design judgement.
- The predict-first evidence comes from physics lectures and data-recall tasks, not from probability simulations. The effect sizes are modest (for example 24% vs 30% fully correct).
- The tutorial studies measure engagement, retention or task success in games and apps, not conceptual learning.
- Boy et al. was read only as an abstract, so its effect sizes and conditions are unknown here.
- The Chameleon numbers are vendor data on SaaS product tours and change from year to year.
- Background sources named but not checked for this note: expertise reversal (Kalyuga et al., 2003), guidance fading (Renkl et al., 2002), segmenting (Mayer & Pilegard), minimalism and the "paradox of the active user" (Carroll & Rosson, 1987), and ICAP (Chi & Wylie, 2014). Their general direction agrees with the above: give less guidance as learners gain skill, let learners pace short segments, and get learners doing things early. None of them was checked for numbers here.

## Sources

- Segel, E., & Heer, J. (2010). Narrative Visualization: Telling Stories with Data. *IEEE TVCG* 16(6). http://vis.stanford.edu/files/2010-Narrative-InfoVis.pdf (§3, §4.1, §4.4.1, §5) [full]
- Andersen, E., et al. (2012). The Impact of Tutorials on Games of Varying Complexity. *CHI 2012*, 59–68. https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf [full]
- Conlen, M., Kale, A., & Heer, J. (2019). Capture & Analysis of Active Reading Behaviors for Interactive Articles on the Web. *Computer Graphics Forum* 38(3). https://idl.cs.washington.edu/files/2019-IdyllAnalytics-EuroVis.pdf [full]
- Kendrick, A. (2020). Mobile Tutorials: Wasted Effort or Efficiency Boost? Nielsen Norman Group. https://www.nngroup.com/articles/mobile-tutorials/ [full]
- Crouch, C. H., Fagen, A. P., Callan, J. P., & Mazur, E. (2004). Classroom demonstrations: Learning tools or entertainment? *Am. J. Phys.* 72(6), 835–838. https://mazur.harvard.edu/presentations/classroom-demonstrations-learning-tools-or-entertainment. Figures are from Crouch's 2006 slides: https://materials.physics.swarthmore.edu/wp-content/uploads/2012/07/BCCEAug06final.pdf [secondary]
- Kim, Y.-S., Reinecke, K., & Hullman, J. (2017). Explaining the Gap: Visualizing One's Predictions Improves Recall and Comprehension of Data. *CHI 2017*. https://idl.uw.edu/papers/explaining-the-gap [abstract]
- Brod, G., Hasselhorn, M., & Bunge, S. A. (2018). When generating a prediction boosts learning: The element of surprise. *Learning and Instruction* 55, 22–31. doi:10.1016/j.learninstruc.2018.01.013 [abstract]
- Boy, J., Détienne, F., & Fekete, J.-D. (2015). Storytelling in Information Visualizations: Does it Engage Users to Explore Data? *CHI 2015*, 1449–1458. https://hal.science/hal-01133595 [abstract]
- Alfieri, L., Brooks, P. J., Aldrich, N. J., & Tenenbaum, H. R. (2011). Does discovery-based instruction enhance learning? *J. Educ. Psych.* 103(1), 1–18. doi:10.1037/a0021017 [abstract]
- Kelleher, C., & Pausch, R. (2005). Stencils-based tutorials: design and evaluation. *CHI 2005*, 541–550. Summary: https://www.cs.cmu.edu/~caitlin/research.htm [authors' summary]
- Koedinger, K. R., et al. (2015). Learning is Not a Spectator Sport: Doing is Better than Watching for Learning from a MOOC. *L@S 2015*, 111–120. Press release: https://www.cmu.edu/news/stories/archives/2015/september/moocs-vs-oli.html [secondary]
- Chameleon (2021). Product tour benchmark report, 2020 data. https://www.chameleon.io/blog/chameleon-benchmark-report [vendor]
