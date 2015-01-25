This branch will add tick based updates,
instead of using time measurements.
Since Date.now() depends on the computer clock,
which most likely differs from the server clock time.