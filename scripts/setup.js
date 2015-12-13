module.exports = {
    initialize: function() {
        this.width = window.outerWidth;
        this.height = window.outerHeight;
        this.orientation = this.width >= this.height ? 'horizontal':'vertical';
        return this;
    }
};