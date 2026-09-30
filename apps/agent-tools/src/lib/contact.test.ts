import { describe, it, expect } from "vitest";
import { extractContactEmails } from "./contact";

describe("extractContactEmails", () => {
  it("finds published contact emails, dropping noreply/example/image-like matches", () => {
    const text = "Contact us at hello@acme.dev or support@acme.dev. Not noreply@github.com, not you@example.com, not logo@2x.png";
    expect(extractContactEmails(text)).toEqual(["hello@acme.dev", "support@acme.dev"]);
  });
  it("decodes mailto links and de-duplicates case-insensitively", () => {
    expect(extractContactEmails('<a href="mailto:Team@Acme.dev?subject=hi">x</a> team@acme.dev')).toEqual(["team@acme.dev"]);
  });
  it("prefers an address on the project's own domain", () => {
    expect(extractContactEmails("a@gmail.com b@acme.dev", "acme.dev")).toEqual(["b@acme.dev", "a@gmail.com"]);
  });

  it("skips single-purpose role inboxes like security@ and license@", () => {
    expect(extractContactEmails("security@acme.dev license@acme.dev hello@acme.dev")).toEqual(["hello@acme.dev"]);
  });
});
