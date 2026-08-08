"use client";

import { FormEvent, useState } from "react";
import { getContent } from "@/content";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function EmailSection() {
  const content = getContent();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isValidEmail(email)) {
      setError(content.email.invalidMessage);
      return;
    }

    setMessage(content.email.successMessage);
    setEmail("");
  }

  return (
    <section
      className="border-t border-border/70 bg-surface py-16 sm:py-20"
      aria-labelledby="email-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
          <h2
            id="email-heading"
            className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
          >
            {content.email.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {content.email.description}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="sr-only">
                {content.email.addressLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={content.email.placeholder}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-navy placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              {content.email.button}
            </Button>

            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="text-sm text-navy" role="status">
                {message}
              </p>
            ) : null}
          </form>
        </div>
      </Container>
    </section>
  );
}
