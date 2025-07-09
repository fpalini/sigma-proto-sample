import { FC, PropsWithChildren } from "react";

const ProgressBar: FC<PropsWithChildren<{ isLoading: boolean }>> = ({
  isLoading
}) => {

  return (
    <div className="progress-bar">
      <progress value={isLoading ? undefined : 0}></progress>
    </div>
  );
};

export default ProgressBar;
