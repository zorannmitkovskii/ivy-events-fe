import { computed, toValue } from "vue";
import { useRoute, useRouter } from "vue-router";
import { onboardingStore } from "@/store/onboarding.store";
import { draftStore } from "@/store/invitationDraft.store";
import { blockingStep, computeCreationSteps, hasOwnDetails } from "@/utils/creationSteps";

/**
 * The stepper's state and navigation for one page of the invitation flow
 * (INV-102).
 *
 * The statuses are read from what the flow already keeps — the onboarding
 * store (type, basics, chosen design) and the local draft (details, programme,
 * story, RSVP) — so they reflect saved data, not which buttons were pressed.
 * A page that holds newer data than those (the basics form while typing, the
 * open editor) passes it in `context` and it wins.
 *
 * Going to a step:
 *  - an earlier required step that is not done (Event, Design) is where the
 *    person is sent instead, to its first missing field;
 *  - optional steps (Details, RSVP, Preview) are never in the way;
 *  - a step with a wrong value (an RSVP deadline already past) opens at it.
 *
 * @param {object} options
 * @param {string|Function|import('vue').Ref} options.current  the step this page is
 * @param {Function} [options.context]  () => overrides for computeCreationSteps
 * @param {object}   [options.handlers]
 *   fix(stepKey, problem) → true when handled on this page;
 *   open(stepKey) → true when handled on this page;
 *   leave() → awaited before navigating to another page (persist what is typed).
 */
export function useCreationSteps({ current, context = () => ({}), handlers = {} } = {}) {
  const route = useRoute();
  const router = useRouter();
  const lang = () => route.params?.lang || "mk";

  const steps = computed(() => {
    return computeCreationSteps({
      current: toValue(current),
      category: onboardingStore.selectedCategory,
      typeCode: onboardingStore.selectedTypeCode,
      basics: onboardingStore.eventDetails,
      hasDesign: !!(onboardingStore.invitationName || onboardingStore.invitationPath),
      hasDetails: hasOwnDetails(draftStore),
      rsvpDeadline: draftStore.theme?.rsvpConfig?.deadline || "",
      ...context(),
    });
  });

  /** The editor for the chosen design, as a new invitation (INV-104). */
  function editorRoute(query) {
    const path = onboardingStore.invitationPath || "";
    if (!path) return { name: "EventInvitationsPage", params: { lang: lang() } };
    const clean = path.startsWith("invitations/") ? path : `invitations/${path}`;
    return { path: `/${lang()}/${clean}`, query: { new: "1", ...query } };
  }

  async function navigate(to) {
    if (handlers.leave) await handlers.leave();
    return router.push(to);
  }

  function fix(step, problem) {
    if (handlers.fix?.(step.key, problem)) return;
    if (step.key === "event") {
      if (problem.field === "category" || problem.field === "type") {
        return navigate({ name: "EventCategoryPage", params: { lang: lang() } });
      }
      return navigate({ name: "EventBasicsPage", params: { lang: lang() }, query: { focus: problem.field } });
    }
    if (step.key === "design") return navigate({ name: "EventInvitationsPage", params: { lang: lang() } });
    if (step.key === "rsvp") return navigate(editorRoute({ edit: "true", step: "rsvp" }));
    return open(step.key);
  }

  function open(key) {
    if (handlers.open?.(key)) return;
    switch (key) {
      case "event":
        return navigate({ name: "EventBasicsPage", params: { lang: lang() } });
      case "design":
        return navigate({ name: "EventInvitationsPage", params: { lang: lang() } });
      case "details":
        return navigate(editorRoute({ edit: "true" }));
      case "rsvp":
        return navigate(editorRoute({ edit: "true", step: "rsvp" }));
      case "preview":
        return navigate(editorRoute({ preview: "1" }));
    }
  }

  /** The stepper asked for `key`. */
  function go(key) {
    const target = blockingStep(steps.value, key);
    if (!target) return;
    if (target.problems.length) return fix(target, target.problems[0]);
    return open(target.key);
  }

  return { steps, go };
}
