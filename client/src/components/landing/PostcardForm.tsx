import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/services/api';

const feedbackFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').max(254),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export function PostcardForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    setSubmitError(null);
    try {
      await api<{ success: boolean; message: string }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSubmitted(true);
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to send postcard. Please check your connection.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">
          CHAPTER 5 · CONTACT & DISPATCH
        </span>
        <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Send a Postcard to BugLife
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Have an idea, found a bug in BugLife, or want to contribute? Send our team a postcard.
        </p>
      </div>

      {/* Postcard Container */}
      <div className="relative w-full max-w-3xl rounded-2xl border-4 border-paper-border bg-paper-card p-6 shadow-2xl sm:p-10">
        {/* Airmail Border Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-3 rounded-t-xl bg-[repeating-linear-gradient(45deg,#ef4444_0,#ef4444_12px,#ffffff_12px,#ffffff_24px,#3b82f6_24px,#3b82f6_36px,#ffffff_36px,#ffffff_48px)] opacity-80" />

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary bg-primary/10 text-primary">
              <CheckCircle2 size={32} />
            </div>
            <div className="relative rounded-lg border-2 border-dashed border-primary/60 px-6 py-2 rotate-[-4deg]">
              <span className="font-serif text-xl font-black uppercase tracking-widest text-primary">
                DELIVERED · 200 OK
              </span>
            </div>
            <h4 className="font-serif text-2xl font-bold text-foreground">
              Postcard Stamped & Dispatched!
            </h4>
            <p className="max-w-md text-sm text-muted-foreground">
              Thank you for sharing your feedback with the BugLife project team. We read every dispatch.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="mt-4 border-paper-border font-mono text-xs"
            >
              Send Another Postcard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-12">
              {/* Left Column: Message Area */}
              <div className="sm:col-span-7 space-y-4">
                <div>
                  <label htmlFor="message" className="block font-mono text-xs font-semibold uppercase text-muted-foreground">
                    Your Message / Dispatch:
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message')}
                    placeholder="Dear BugLife Team,&#10;&#10;Here are my thoughts on student developer workflows..."
                    className="mt-1 w-full rounded-xl border border-paper-border bg-paper/60 p-4 font-serif text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-paper focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.message && (
                    <p className="mt-1 font-mono text-[11px] text-destructive">
                      {errors.message.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Address Lines & Stamp */}
              <div className="sm:col-span-5 flex flex-col justify-between space-y-4 border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-paper-border pt-6 sm:pt-0 sm:pl-8">
                {/* Stamp Section */}
                <div className="flex items-start justify-end">
                  <div className="flex h-20 w-16 flex-col items-center justify-center rounded border-2 border-dashed border-primary/60 bg-primary/10 text-center shadow-inner">
                    <span className="font-mono text-[9px] font-bold uppercase text-primary">
                      BUGLIFE
                    </span>
                    <span className="font-serif text-xs font-black text-primary">POST</span>
                    <span className="font-mono text-[9px] text-muted-foreground">AIR</span>
                  </div>
                </div>

                {/* Name & Email inputs styled as address lines */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block font-mono text-xs font-semibold uppercase text-muted-foreground">
                      Recipient / Sender Name:
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      placeholder="e.g. Samar Vishwakarma"
                      className="mt-1 w-full border-b border-paper-border bg-transparent px-1 py-1.5 font-serif text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    />
                    {errors.name && (
                      <p className="mt-1 font-mono text-[11px] text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-mono text-xs font-semibold uppercase text-muted-foreground">
                      Return Email Address:
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="your.email@university.edu"
                      className="mt-1 w-full border-b border-paper-border bg-transparent px-1 py-1.5 font-serif text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    />
                    {errors.email && (
                      <p className="mt-1 font-mono text-[11px] text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 font-mono text-xs uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Dispatching…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Postcard
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Postcard Footer Note */}
        <div className="mt-8 flex items-center justify-between border-t border-paper-border pt-4 font-mono text-[11px] text-muted-foreground">
          <span>PAR AVION · OFFICIAL BUGLIFE DISPATCH</span>
          <span>RATE-LIMITED (5/15MIN)</span>
        </div>
      </div>
    </div>
  );
}
