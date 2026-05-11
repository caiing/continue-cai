import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { CustomScrollbarDiv } from ".";
import { useAuth } from "../context/Auth";
import { IdeMessengerContext } from "../context/IdeMessenger";
import TelemetryProviders from "../hooks/TelemetryProviders";
import { useWebviewListener } from "../hooks/useWebviewListener";
import Login from "../pages/Login";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setCodeToEdit } from "../redux/slices/editState";
import { setDialogMessage, setShowDialog } from "../redux/slices/uiSlice";
import { enterEdit, exitEdit } from "../redux/thunks/edit";
import { saveCurrentSession } from "../redux/thunks/session";
import { fontSize, isMetaEquivalentKeyPressed } from "../util";
import { ROUTES } from "../util/navigation";
import { FatalErrorIndicator } from "./config/FatalErrorNotice";
import TextDialog from "./dialogs";
import { GenerateRuleDialog } from "./GenerateRuleDialog";
import RingLoader from "./loaders/RingLoader";
import { useMainEditor } from "./mainInput/TipTapEditor";
import { isNewUserOnboarding, useOnboardingCard } from "./OnboardingCard";
import OSRContextMenu from "./OSRContextMenu";
import PostHogPageView from "./PosthogPageView";

const LayoutTopDiv = styled(CustomScrollbarDiv)`
  height: 100%;
  position: relative;
  overflow-x: hidden;
`;

const GridDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100vh;
  overflow-x: visible;
`;

const Layout = () => {
  const [showStagingIndicator, setShowStagingIndicator] = useState(false);
  const hasTriggeredAutoLoginRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const onboardingCard = useOnboardingCard();
  const ideMessenger = useContext(IdeMessengerContext);
  const { session, login, isInitialLoading, loginRequired } = useAuth();

  const { mainEditor } = useMainEditor();
  const dialogMessage = useAppSelector((state) => state.ui.dialogMessage);

  const showDialog = useAppSelector((state) => state.ui.showDialog);
  const isInEdit = useAppSelector((store) => store.session.isInEdit);
  const isHome =
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.HOME_INDEX;

  useEffect(() => {
    (async () => {
      const response = await ideMessenger.request(
        "controlPlane/getEnvironment",
        undefined,
      );
      response.status === "success" &&
        setShowStagingIndicator(response.content.AUTH_TYPE.includes("staging"));
    })();
  }, []);

  useWebviewListener(
    "newSession",
    async () => {
      navigate(ROUTES.HOME);
      if (isInEdit) {
        await dispatch(exitEdit({}));
      } else {
        await dispatch(
          saveCurrentSession({
            openNewSession: true,
            generateTitle: true,
          }),
        );
      }
    },
    [isInEdit],
  );

  useWebviewListener(
    "isContinueInputFocused",
    async () => {
      return false;
    },
    [isHome],
    isHome,
  );

  useWebviewListener(
    "focusContinueInputWithNewSession",
    async () => {
      navigate(ROUTES.HOME);
      if (isInEdit) {
        await dispatch(
          exitEdit({
            openNewSession: true,
          }),
        );
      } else {
        await dispatch(
          saveCurrentSession({
            openNewSession: true,
            generateTitle: true,
          }),
        );
      }
    },
    [isHome, isInEdit],
    isHome,
  );

  useWebviewListener(
    "addModel",
    async () => {
      navigate("/models");
    },
    [navigate],
  );

  useWebviewListener(
    "navigateTo",
    async (data) => {
      if (data.toggle && location.pathname === data.path) {
        navigate("/");
      } else {
        navigate(data.path);
      }
    },
    [location, navigate],
  );

  useWebviewListener(
    "setupLocalConfig",
    async () => {
      // onboardingCard.open(OnboardingModes.LOCAL);
    },
    [],
  );

  useWebviewListener(
    "freeTrialExceeded",
    async () => {
      // dispatch(setShowDialog(true));
      // onboardingCard.setActiveTab(OnboardingModes.MODELS_ADD_ON);
      // dispatch(
      //   setDialogMessage(
      //     <div className="flex-1">
      //       <OnboardingCard isDialog />
      //     </div>,
      //   ),
      // );
    },
    [],
  );

  useWebviewListener(
    "setupApiKey",
    async () => {
      // onboardingCard.open(OnboardingModes.API_KEY);
    },
    [],
  );

  useWebviewListener(
    "focusEdit",
    async () => {
      await ideMessenger.request("edit/addCurrentSelection", undefined);
      await dispatch(enterEdit({ editorContent: mainEditor?.getJSON() }));
      mainEditor?.commands.focus();
    },
    [ideMessenger, mainEditor],
  );

  useWebviewListener(
    "setCodeToEdit",
    async (payload) => {
      dispatch(
        setCodeToEdit({
          codeToEdit: payload,
        }),
      );
    },
    [],
  );

  useWebviewListener(
    "exitEditMode",
    async () => {
      await dispatch(exitEdit({}));
    },
    [],
  );

  useWebviewListener(
    "generateRule",
    async () => {
      dispatch(setShowDialog(true));
      dispatch(setDialogMessage(<GenerateRuleDialog />));
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (isMetaEquivalentKeyPressed(event) && event.code === "KeyC") {
        const selection = window.getSelection()?.toString();
        if (selection) {
          setTimeout(() => {
            void navigator.clipboard.writeText(selection);
          }, 100);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isNewUserOnboarding() && isHome) {
      // onboardingCard.open();
    }
  }, [isHome]);

  useEffect(() => {
    if (isInitialLoading || session || !loginRequired) {
      return;
    }

    if (hasTriggeredAutoLoginRef.current) {
      return;
    }

    hasTriggeredAutoLoginRef.current = true;
    void login(false);
  }, [isInitialLoading, session, loginRequired, login]);

  // 如果正在进行初始加载，渲染加载状态以避免黑屏

  return (
    <TelemetryProviders>
      <LayoutTopDiv>
        <div
          // style={{
          //   height: "100%",
          //   display: "flex",
          //   flexDirection: "column",
          // }}
          style={{
            scrollbarGutter: "stable both-edges",
            minHeight: "100%",
            display: "grid",
            gridTemplateRows: "1fr auto",
          }}
        >
          {isInitialLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <RingLoader size={40} />
            </div>
          ) : !session && loginRequired ? (
            <Login
              loginAction={() => login(false)}
              onLogin={() => {
                // 登录成功后的逻辑
              }}
            />
          ) : (
            <>
              {showStagingIndicator && (
                <span
                  title="Staging environment"
                  className="absolute right-0 mx-1.5 h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--vscode-list-warningForeground)",
                  }}
                />
              )}
              <OSRContextMenu />
              <TextDialog
                showDialog={showDialog}
                onEnter={() => {
                  dispatch(setShowDialog(false));
                }}
                onClose={() => {
                  dispatch(setShowDialog(false));
                }}
                message={dialogMessage}
              />

              <GridDiv>
                <PostHogPageView />
                <Outlet />
                {/* The fatal error for chat is shown below input */}
                {!isHome && <FatalErrorIndicator />}
              </GridDiv>
            </>
          )}
        </div>
        <div style={{ fontSize: fontSize(-4) }} id="tooltip-portal-div" />
      </LayoutTopDiv>
    </TelemetryProviders>
  );
};

export default Layout;
