# Overwatch 2 Countdown Clock

A countdown clock to important dates for Overwatch 2

![](https://i.imgur.com/GKIba9d.gif)

## Tech Stack

[ow2countdown.com](https://ow2countdown.com) uses [SvelteKit](https://kit.svelte.dev/) backed by [Supabase](https://supabase.com/)

![svelte icon](https://github.com/sveltejs/branding/blob/master/svelte-horizontal.png)
![supabase icon](https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only)

## Deploying

To run the site locally:

```bash
npm run dev
```

To create a production version of your app:

```bash
npm run build
```

Environment variables for Supabase's URL and anonymous access token must be set as `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`, respectively.

You can preview the production build with `npm run preview`.

> To deploy, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
