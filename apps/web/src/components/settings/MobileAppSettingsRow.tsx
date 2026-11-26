import { T, useGT, Var } from "gt-react";

import { RELEASES_URL } from "../../branding.logic";
import { AppleIcon } from "../Icons";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";
import { QRCodeSvg } from "../ui/qr-code";
import { SettingsRow } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";

const store = "GitHub Releases";

export function MobileAppSettingsRow() {
  const searchableSetting = useSearchableSetting();
  const gt = useGT();
  return (
    <SettingsRow
      {...searchableSetting("mobile-app")}
      description={gt("Connect to your server from your phone or tablet.")}
      control={
        <Popover>
          <PopoverTrigger render={<Button size="sm" variant="outline" />}>
            <AppleIcon />
            {gt("iPhone and iPad")}
          </PopoverTrigger>
          <PopoverPopup align="end">
            <div className="flex flex-col items-center gap-3">
              <PopoverTitle>{store}</PopoverTitle>
              <p className="text-xs text-muted-foreground">
                <T>Scan with your phone camera.</T>
              </p>
              <div className="rounded-lg bg-white p-1.5">
                <QRCodeSvg
                  value={RELEASES_URL}
                  size={128}
                  level="M"
                  marginSize={1}
                  title={gt("{store} link", { store })}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                render={<a href={RELEASES_URL} target="_blank" rel="noreferrer noopener" />}
              >
                <T>
                  Open <Var>{store}</Var>
                </T>
              </Button>
            </div>
          </PopoverPopup>
        </Popover>
      }
    />
  );
}
