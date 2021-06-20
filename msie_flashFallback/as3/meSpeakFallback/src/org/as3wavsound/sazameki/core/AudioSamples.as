package org.as3wavsound.sazameki.core {
	
	/**
	 * Contains lists of samples -left and optionally right- decoded from a 
	 * WAVE ByteArray or manually mixed samples.
	 * 
	 * Also contains a reference to an AudioSetting instance associated by 
	 * this samples container.
	 * 
	 * @author Takaaki Yamazaki(zk design), 
	 * @author Benny Bottema (modified, optimized and cleaned up code)
	 */
	public class AudioSamples {
		public var _left:Vector.<Number>;
		public var _right:Vector.<Number>;
		private var _setting:AudioSetting;
		
		/**
		 * @param	length Can be zero when decoding WAVE data, or a fixed buffer 
		 * 			size when mixing to a Sound's outputstream.
		 */
		public function AudioSamples(setting:AudioSetting, length:Number = 0) {
			this._setting = setting;
			this._left = new Vector.<Number>(length, length > 0);
			if (setting.channels == 2) {
				this._right = new Vector.<Number>(length, length > 0);
			}
		}
		
		/**
		 * Always resets length to its former state. Don't call this after creating 
		 * an instance of AudioSamples, or its length is always zero.
		 */
		public function clearSamples():void {
			_left = new Vector.<Number>(length, true);
			if (setting.channels == 2) {
				_right = new Vector.<Number>(length, true);
			}
		}
		
		public function get length():int {
			return left.length;
		}
		
		public function get setting():AudioSetting {
			return _setting;
		}
		
		public function get left():Vector.<Number> {
			return _left;
		}
		
		public function get right():Vector.<Number> {
			return _right;
		}
	}
}