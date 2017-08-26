'use strict';

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import format from 'date-format';

class Dashboard {
    constructor() {
        this.widgets = {};

        // Configure blessed
        this.screen = blessed.screen({
            title: 'Lilo Dashboard',
            autoPadding: true,
            dockBorders: true,
            fullUnicode: true,
            smartCSR: true
        });

        this.screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));

        // Grid settings
        this.grid = new contrib.grid({
            screen: this.screen,
            rows: 12,
            cols: 12
        });

        // Graphs
        this.graphs = {
            all: {
                title: 'Total',
                x: [],
                y: [],
                style: {
                    line: 'red'
                }
            },
            current: {
                title: 'Actual drops',
                x: [],
                y: [],
                style: {
                    line: 'yellow'
                }
            },
            invested: {
                title: 'Invested drops',
                x: [],
                y: [],
                style: {
                    line: 'blue'
                }
            },
        };

        // Shared settings
        const shared = {
            border: {
                type: 'line'
            },
            style: {
                fg: 'blue',
                text: 'blue',
                border: {
                    fg: 'green'
                }
            }
        };

        // Widgets
        const widgets = {
            graph: {
                type: contrib.line,
                size: {
                    width: 9,
                    height: 5,
                    top: 0,
                    left: 0
                },
                options: Object.assign({}, shared, {
                    label: 'Number of drops',
                    showLegend: true,
                    legend: {
                        width: 20
                    }
                })
            },
            settings: {
                type: contrib.log,
                size: {
                    width: 3,
                    height: 5,
                    top: 0,
                    left: 9
                },
                options: Object.assign({}, shared, {
                    label: 'Settings',
                    padding: {
                        left: 1
                    }
                })
            },
            log: {
                type: contrib.log,
                size: {
                    width: 12,
                    height: 7,
                    top: 5,
                    left: 0
                },
                options: Object.assign({}, shared, {
                    label: 'Log',
                    padding: {
                        left: 1,
                        bottom: 1
                    }
                })
            }
        };

        for (let name in widgets) {
            let widget = widgets[name];

            this.widgets[name] = this.grid.set(
                widget.size.top,
                widget.size.left,
                widget.size.height,
                widget.size.width,
                widget.type,
                widget.options
            );
        }
    }

    /**
     * Plot graph data
     *
     * @param {Arr} prices
     *
     * @return {Void}
     */
    plot(data) {
        const now = format('MM/dd/yy-hh:mm:ss', new Date());

        Object.assign(this.graphs.all, {
            x: [...this.graphs.all.x, now],
            y: [...this.graphs.all.y, data.all]
        });

        Object.assign(this.graphs.current, {
            x: [...this.graphs.current.x, now],
            y: [...this.graphs.current.y, data.current]
        });

        Object.assign(this.graphs.invested, {
            x: [...this.graphs.invested.x, now],
            y: [...this.graphs.invested.y, data.invested]
        });

        this.widgets.graph.setData([
            this.graphs.all,
            this.graphs.current,
            this.graphs.invested
        ]);
    }

    /**
     * Log data
     *
     * @param {Arr} messages
     *
     * @return {Void}
     */
    log(messages) {
        const now = format('MM/dd/yy-hh:mm:ss', new Date());
        messages.forEach((m) => this.widgets.log.log(`${now}: ${m}`));
    }

    /**
     * Display settings
     *
     * @param {Arr} config
     *
     * @return {Void}
     */
    settings(config) {
        config.forEach((c) => this.widgets.settings.add(c))
    }

    /**
     * Render
     *
     * @return {Void}
     */
    render() {
        this.screen.render();
    }
}

export default Dashboard;
