#!/bin/bash

# Define the session name
SESSION="Test-Lint"

# Define your project working directory
# e.g, WORKDIR="$HOME/Engineering/fullcourt/fullcourt-backend"
WORKDIR="."

# Unset TMUX if running inside an existing tmux session to avoid nesting
if [ -n "$TMUX" ]; then
  echo "Warning: Already inside a tmux session. Unsetting TMUX to avoid nesting."
  unset TMUX
fi

if tmux has-session -t $SESSION 2>/dev/null; then
  echo "Session '$SESSION' already exists. Killing the existing session."
  tmux kill-session -t $SESSION
fi

# Create a new window test and lint
tmux new-session -d -s $SESSION -n "Test-Lint"

# Run 'yarn run test:e2e' in the first pane
tmux send-keys -t $SESSION:Test-Lint "cd $WORKDIR && yarn run test:e2e" C-m

# Create a horizontal split and run 'yarn run lint' in the new pane
tmux split-window -h -t $SESSION:Test-Lint
tmux send-keys -t $SESSION:Test-Lint.1 "cd $WORKDIR && yarn run lint" C-m

# Create a horizontal split and run 'yarn run test' in the new pane
tmux split-window -h -t $SESSION:Test-Lint
tmux send-keys -t $SESSION:Test-Lint.2 "cd $WORKDIR && yarn run test" C-m

# Attach to the session
tmux attach -t $SESSION
