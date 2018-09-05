/**
* --------------------------------------------------------------------------
* Licensed under MIT (https://github.com/quark-dev/Phonon-Framework/blob/master/LICENSE)
* --------------------------------------------------------------------------
*/
import Event from '../../common/events';
import Component from '../component';
import { createJqueryPlugin, sleep } from '../../common/utils';

const Notification = (($) => {
  /**
   * ------------------------------------------------------------------------
  * Constants
  * ------------------------------------------------------------------------
  */

  const NAME = 'notification';
  const VERSION = '2.0.0';
  const DEFAULT_PROPERTIES = {
    element: null,
    message: '',
    showButton: true,
    timeout: null,
    background: 'primary',
  };
  const DATA_ATTRS_PROPERTIES = [
    'timeout',
  ];

  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  class Notification extends Component {
    constructor(options = {}) {
      super(NAME, VERSION, DEFAULT_PROPERTIES, options, DATA_ATTRS_PROPERTIES, true, false);

      this.template = ''
      + '<div class="notification">'
        + '<div class="notification-inner">'
          + '<div class="message"></div>'
          + '<button type="button" class="close" data-dismiss="notification" aria-label="Close">'
            + '<span aria-hidden="true">&times;</span>'
          + '</button>'
        + '</div>'
      + '</div>';

      if (this.dynamicElement) {
        this.build();
      }

      this.timeoutCallback = null;
    }

    build() {
      const builder = document.createElement('div');

      builder.innerHTML = this.template;

      this.options.element = builder.firstChild;

      // text message
      this.options.element.querySelector('.message').innerHTML = this.options.message;

      if (!this.options.showButton) {
        this.options.element.querySelector('button').style.display = 'none';
      }

      document.body.appendChild(this.options.element);

      this.setAttributes();
    }

    /**
     * Shows the notification
     * @returns {Promise} Promise object represents the completed animation
     */
    show() {
      return new Promise(async (resolve, reject) => {
        if (this.options.element === null) {
          // build and insert a new DOM element
          this.build();
        }

        if (this.options.element.classList.contains('show')) {
          reject(new Error('The notification is already active'));
          return;
        }

        // reset color
        if (this.options.background) {
          this.options.element.removeAttribute('class');
          this.options.element.setAttribute('class', 'notification');

          this.options.element.classList.add(`bg-${this.options.background}`);
          this.options.element.querySelector('button').classList.add(`btn-${this.options.background}`);
        }

        if (this.options.showButton) {
          // attach the button handler
          const buttonElement = this.options.element.querySelector('button');
          this.registerElement({ target: buttonElement, event: 'click' });
        }

        await sleep(20);

        if (Number.isInteger(this.options.timeout) && this.options.timeout > 0) {
          // if there is a timeout, auto hide the notification
          this.timeoutCallback = setTimeout(() => {
            this.hide();
          }, this.options.timeout + 1);
        }

        this.options.element.classList.add('show');

        // set position
        const activeNotifications = document.querySelectorAll('.notification.show') || [];
        let pushDistance = 0;
        activeNotifications.forEach((notification) => {
          if (this.options.element !== notification) {
            const style = getComputedStyle(notification);
            pushDistance += notification.offsetHeight + parseInt(style.marginBottom, 10);
          }
        });

        this.options.element.style.transform = `translateY(${pushDistance}px)`;

        this.triggerEvent(Event.SHOW);

        const onShown = () => {
          this.triggerEvent(Event.SHOWN);
          this.options.element.removeEventListener(Event.TRANSITION_END, onShown);

          resolve();
        };

        this.options.element.addEventListener(Event.TRANSITION_END, onShown);

        return true;
      });
    }

    /**
     * Hides the notification
     * @returns {Promise} Promise object represents the completed animation
     */
    hide() {
      return new Promise((resolve, reject) => {
        /*
        * prevent to close a notification with a timeout
        * if the user has already clicked on the button
        */
        if (this.timeoutCallback) {
          clearTimeout(this.timeoutCallback);
          this.timeoutCallback = null;
        }

        if (!this.options.element.classList.contains('show')) {
          reject(new Error('The notification is not active'));
          return;
        }

        this.triggerEvent(Event.HIDE);

        if (this.options.showButton) {
          const buttonElement = this.options.element.querySelector('button');
          this.unregisterElement({ target: buttonElement, event: 'click' });
        }

        this.options.element.classList.remove('show');
        this.options.element.classList.add('hide');

        const onHidden = () => {
          this.options.element.removeEventListener(Event.TRANSITION_END, onHidden);
          this.options.element.classList.remove('hide');

          this.triggerEvent(Event.HIDDEN);

          if (this.dynamicElement) {
            document.body.removeChild(this.options.element);
            this.options.element = null;
          }

          resolve();
        };

        this.options.element.addEventListener(Event.TRANSITION_END, onHidden);
      });
    }

    onElementEvent() {
      this.hide();
    }

    static identifier() {
      return NAME;
    }

    static DOMInterface(options) {
      return super.DOMInterface(Notification, options);
    }
  }

  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   */
  createJqueryPlugin($, NAME, Notification);


  return Notification;
})(window.$ ? window.$ : null);

export default Notification;
