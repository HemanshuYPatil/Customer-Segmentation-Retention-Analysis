from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Paths:
    root: Path
    data: Path
    artifacts: Path
    reports: Path


@dataclass(frozen=True)
class Config:
    data_file: Path
    churn_window_days: int = 90
    ltv_horizon_days: int = 180
    holdout_days: int = 90
    random_state: int = 42
    min_transactions: int = 2
    k_range: tuple = (3, 8)
    mlflow_experiment: str = "customer_segmentation_retention"


def get_paths() -> Paths:
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "dataset"
    if not data_dir.exists():
        data_dir = root / "datasets"
    return Paths(
        root=root,
        data=data_dir,
        artifacts=root / "artifacts",
        reports=root / "reports",
    )


def get_config() -> Config:
    paths = get_paths()
    return Config(
        data_file=paths.data / "OnlineRetail.csv",
    )
