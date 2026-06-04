from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError as exc:
    raise SystemExit("Missing dependency: run `pip install requests` first.") from exc


def get_value_by_path(payload: dict[str, Any], key_path: str) -> Any:
    current: Any = payload
    for part in key_path.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def parse_headers(header_values: list[str]) -> dict[str, str]:
    headers: dict[str, str] = {}
    for header in header_values:
        if ":" not in header:
            raise SystemExit(f"Invalid header, expected `Name: value`: {header}")
        name, value = header.split(":", 1)
        headers[name.strip()] = value.strip()
    return headers


def upload_zip(
    api_url: str,
    zip_path: Path,
    user_id: str,
    user_id_field: str,
    user_id_location: str,
    file_field: str,
    task_id_key: str,
    timeout: int,
    headers: dict[str, str],
    verify_ssl: bool,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "zipName": zip_path.name,
        "zipPath": str(zip_path),
        "taskId": None,
        "success": False,
        "request": {
            "apiUrl": api_url,
            "userIdField": user_id_field,
            "userIdLocation": user_id_location,
            "fileField": file_field,
        },
    }

    try:
        with zip_path.open("rb") as file_obj:
            request_kwargs: dict[str, Any] = {
                "files": {file_field: (zip_path.name, file_obj, "application/zip")},
                "headers": headers,
                "timeout": timeout,
                "verify": verify_ssl,
            }

            if user_id_location == "params":
                request_kwargs["params"] = {user_id_field: user_id}
            elif user_id_location == "form":
                request_kwargs["data"] = {user_id_field: user_id}
            else:
                raise ValueError(f"Unsupported user id location: {user_id_location}")

            response = requests.post(
                api_url,
                **request_kwargs,
            )

        result["statusCode"] = response.status_code
        result["reason"] = response.reason
        result["finalUrl"] = response.url
        result["elapsedSeconds"] = response.elapsed.total_seconds()

        try:
            payload = response.json()
            result["response"] = payload
        except ValueError:
            result["error"] = "Response is not valid JSON"
            result["responseText"] = response.text[:2000]
            return result

        if not response.ok:
            result["error"] = f"HTTP {response.status_code}"
            result["responseText"] = response.text[:2000]
            return result

        task_id = get_value_by_path(payload, task_id_key)
        if task_id is None:
            result["error"] = f"Cannot find taskId by key path: {task_id_key}"
            return result

        result["taskId"] = task_id
        result["success"] = True
        return result

    except requests.exceptions.RequestException as exc:
        result["exceptionType"] = type(exc).__name__
        result["error"] = str(exc)
        if exc.response is not None:
            result["statusCode"] = exc.response.status_code
            result["reason"] = exc.response.reason
            result["finalUrl"] = exc.response.url
            result["responseText"] = exc.response.text[:2000]
        return result
    except Exception as exc:
        result["exceptionType"] = type(exc).__name__
        result["error"] = str(exc)
        return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upload zip files directly under one folder and save taskId results to JSON."
    )
    parser.add_argument("--api-url", required=True, help="Upload API URL.")
    parser.add_argument("--zip-dir", required=True, help="Folder that directly contains zip files.")
    parser.add_argument("--user-id", required=True, help="Value for the userId params field.")
    parser.add_argument("--output", default="task_results.json", help="Output JSON file path.")
    parser.add_argument("--user-id-field", default="userId", help="Query params field name for user id.")
    parser.add_argument(
        "--user-id-location",
        choices=["params", "form"],
        default="params",
        help="Send user id in URL query params or multipart form fields.",
    )
    parser.add_argument("--file-field", default="file", help="Multipart file field name.")
    parser.add_argument(
        "--header",
        action="append",
        default=[],
        help="Extra request header. Can be repeated, for example: --header \"Authorization: Bearer xxx\"",
    )
    parser.add_argument(
        "--task-id-key",
        default="taskId",
        help="Key path for taskId in response JSON, for example: taskId or data.taskId.",
    )
    parser.add_argument("--timeout", type=int, default=120, help="Request timeout in seconds.")
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable SSL certificate verification. Use only for trusted internal HTTPS APIs.",
    )
    args = parser.parse_args()

    zip_dir = Path(args.zip_dir).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    headers = parse_headers(args.header)

    if not zip_dir.is_dir():
        raise SystemExit(f"Zip folder does not exist or is not a directory: {zip_dir}")

    zip_paths = sorted(
        path for path in zip_dir.iterdir() if path.is_file() and path.suffix.lower() == ".zip"
    )

    results: list[dict[str, Any]] = []
    for index, zip_path in enumerate(zip_paths, start=1):
        print(f"[{index}/{len(zip_paths)}] Uploading {zip_path.name}")
        results.append(
            upload_zip(
                api_url=args.api_url,
                zip_path=zip_path,
                user_id=args.user_id,
                user_id_field=args.user_id_field,
                user_id_location=args.user_id_location,
                file_field=args.file_field,
                task_id_key=args.task_id_key,
                timeout=args.timeout,
                headers=headers,
                verify_ssl=not args.insecure,
            )
        )

    summary = {
        "zipDir": str(zip_dir),
        "total": len(results),
        "successCount": sum(1 for item in results if item["success"]),
        "failureCount": sum(1 for item in results if not item["success"]),
        "results": results,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Done. Saved results to {output_path}")


if __name__ == "__main__":
    main()
