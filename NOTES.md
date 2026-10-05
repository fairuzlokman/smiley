# What I would do differently with more time

**Move the heavy work off the request path.** Analysis runs inside the upload request.
That is fine at ~100–300 ms per image once warm, but a cold Vercel function pays for
loading TensorFlow and the weights. With more time I would upload straight from the
browser to Blob, enqueue a job, and let the dashboard poll or stream the result. It also
removes the 4 MB body cap.

**Replace face-api.** It still works well, but the project is archived. `@vladmandic/human`
is maintained by the same author and exposes the same expression outputs, so the swap is
contained to `src/lib/smile/faceApiAnalyzer.ts`. I would also add a small benchmark set of
labelled photos to catch regressions when swapping models or thresholds.

**Harden auth.** Short-lived access token plus a rotating refresh token, a per-IP/per-user
rate limit on login and upload, and account deletion (which also deletes Blob files). If
social login became a requirement I would move to Auth.js rather than extend the
hand-rolled version.

**More test layers.** One Playwright journey (register → upload → see score) against a
production build, and a contract test for the real `FaceApiAnalyzer` on a couple of fixture
images, kept out of the default `npm test` so unit tests stay fast.

**Operational basics.** Structured logging with request IDs, error reporting, and a health
check that confirms the model weights load, so a bad deploy is caught before a user hits it.

**Product polish.** Image moderation before storing, a history page with pagination and
delete, an explanation of which face was scored (draw the box on the preview), and dark mode.
