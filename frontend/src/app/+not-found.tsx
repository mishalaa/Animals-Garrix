import { Redirect } from 'expo-router';

/** Any unknown address (an old link, or the app opened under a sub-path) goes to Home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
