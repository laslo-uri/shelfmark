use std::path::{Path, PathBuf};
use std::process::Command;

/// Finds `lorekeep.exe`: beside this app's exe first (an installed copy), otherwise each parent folder is
/// tried for `lorekeep/src-tauri/target/release/lorekeep.exe`, which from
/// `_apps/<app>/src-tauri/target/release/` reaches `_apps/lorekeep/...`.
pub fn find_lorekeep(start: &Path) -> Option<PathBuf> {
    let beside = start.join("lorekeep.exe");
    if beside.is_file() {
        return Some(beside);
    }
    let release = Path::new("lorekeep")
        .join("src-tauri")
        .join("target")
        .join("release")
        .join("lorekeep.exe");
    let mut dir = start.to_path_buf();
    for _ in 0..8 {
        let built = dir.join(&release);
        if built.is_file() {
            return Some(built);
        }
        if !dir.pop() {
            break;
        }
    }
    None
}

/// Opens the LoreKeep lobby, or focuses it when it is already open (it is single-instance).
#[tauri::command]
pub fn open_lorekeep() -> Result<(), String> {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(Path::to_path_buf))
        .ok_or("cannot find this app's folder")?;
    let path = find_lorekeep(&exe_dir).ok_or("LoreKeep is not built yet")?;
    let mut command = Command::new(&path);
    if let Some(dir) = path.parent() {
        command.current_dir(dir);
    }
    command.spawn().map_err(|err| err.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_root(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "lorekeep-back-test-{}-{name}-{}",
            env!("CARGO_PKG_NAME"),
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn touch(path: &Path) {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, b"").unwrap();
    }

    #[test]
    fn finds_the_sibling_lorekeep_release_build() {
        let apps = temp_root("sibling");
        let start = apps.join("app/src-tauri/target/release");
        fs::create_dir_all(&start).unwrap();
        assert_eq!(find_lorekeep(&start), None);
        let exe = apps.join("lorekeep/src-tauri/target/release/lorekeep.exe");
        touch(&exe);
        assert_eq!(find_lorekeep(&start), Some(exe));
        let _ = fs::remove_dir_all(&apps);
    }

    #[test]
    fn prefers_lorekeep_beside_this_exe() {
        let dir = temp_root("beside");
        let exe = dir.join("lorekeep.exe");
        touch(&exe);
        assert_eq!(find_lorekeep(&dir), Some(exe));
        let _ = fs::remove_dir_all(&dir);
    }
}
