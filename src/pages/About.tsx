import { FC } from "react";
import { ButtonItem, PanelSectionRow, Navigation } from "@decky/ui";
import { FiGithub } from "react-icons/fi";

export const About: FC = () => {
  return (
    // The outermost div is to push the content down into the visible area
    <>
      <h2
        style={{ fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px" }}
      >
        DeckyClash
      </h2>
      <span>
        Light-weight Clash/Mihomo proxy client for Steam OS.
        <br />
      </span>
      <PanelSectionRow>
        <ButtonItem
          icon={<FiGithub style={{ display: "block" }} />}
          label="DeckyClash"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/chenx-dust/DeckyClash"
            );
          }}
        >
          GitHub Repo
        </ButtonItem>
      </PanelSectionRow>
    </>
  );
};
