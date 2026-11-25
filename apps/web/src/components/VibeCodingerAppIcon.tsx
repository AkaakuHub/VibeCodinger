import appIconUrl from "../../../../assets/prod/vc-black-web-apple-touch-180.png";

export function VibeCodingerAppIcon(props: { readonly className?: string }) {
  return <img src={appIconUrl} alt="" className={props.className} />;
}
